<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\TenantContextService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * TenantController (Super Admin)
 *
 * Platform-level CRUD for tenants. Only accessible to super_admin role.
 */
class TenantController extends Controller
{
    public function index()
    {
        $tenants = Tenant::withTrashed()
            ->whereNull('parent_id')
            ->orderBy('id', 'asc')
            ->with(['children' => function ($query) {
                $query->withTrashed()->orderBy('name', 'asc')->withCount(['users', 'orders']);
            }])
            ->withCount(['users', 'orders'])
            ->get();

        return view('admin.tenants.index', compact('tenants'));
    }

    public function create()
    {
        return view('admin.tenants.create');
    }

    public function store(Request $request)
    {
        $validated = $this->validatedTenantData($request);

        if ($request->hasFile('logo_file')) {
            $validated['logo_path'] = $request->file('logo_file')->store('logos', 'public');
        }

        $isActive = ($validated['status'] !== 'suspended');
        $tenant = Tenant::create(array_merge($validated, ['is_active' => $isActive]));

        return redirect()->route('admin.tenants.index')
            ->with('success', "Tenant {$tenant->name} created.");
    }

    public function edit(Tenant $tenant)
    {
        return view('admin.tenants.edit', compact('tenant'));
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $this->validatedTenantData($request, $tenant);
        
        if ($request->hasFile('logo_file')) {
            // Delete old logo if exists
            if ($tenant->logo_path) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($tenant->logo_path);
            }
            $validated['logo_path'] = $request->file('logo_file')->store('logos', 'public');
        }

        $isActive = ($validated['status'] !== 'suspended');
        $tenant->update(array_merge($validated, ['is_active' => $isActive]));

        return redirect()->route('admin.tenants.index')
            ->with('success', "Tenant {$tenant->name} updated.");
    }

    public function suspend(Tenant $tenant)
    {
        $tenant->update(['is_active' => false, 'status' => 'suspended']);
        return back()->with('success', "Tenant {$tenant->name} suspended.");
    }

    public function reactivate(Tenant $tenant)
    {
        $tenant->update(['is_active' => true, 'status' => 'permanent']);
        return back()->with('success', "Tenant {$tenant->name} reactivated.");
    }

    /** Impersonate a tenant context as Super Admin. */
    public function impersonate(Tenant $tenant)
    {
        /** @var \App\Models\User|null $user */
        $user = auth()->user();
        if (! $user || ! $user->isSuperAdmin()) {
            abort(403, 'Only Super Admin can impersonate tenants.');
        }

        session(['is_impersonating' => true, 'impersonated_tenant_id' => $tenant->id]);
        TenantContextService::setActiveTenant($tenant->id);
        return redirect()->route('dashboard')->with('info', "Now viewing as: {$tenant->name}");
    }

    /** Exit tenant impersonation. */
    public function exitImpersonate()
    {
        session()->forget(['is_impersonating', 'impersonated_tenant_id', config('multitenancy.session_key')]);
        TenantContextService::reset();
        return redirect()->route('admin.tenants.index')->with('success', 'Exited tenant impersonation.');
    }

    private function validatedTenantData(Request $request, ?Tenant $tenant = null): array
    {
        $tenantId = $tenant?->id;
        $passwordRules = $tenant ? ['nullable', 'string', 'min:8', 'confirmed'] : ['required', 'string', 'min:8', 'confirmed'];

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:100'],
            'slug'          => ['required', 'string', 'regex:/^[a-z0-9\-]+$/', Rule::unique('tenants', 'slug')->ignore($tenantId)],
            'contact_email' => ['required', 'email'],
            'contact_phone' => ['required', 'string', 'regex:/^[0-9\-\+\s]+$/', 'min:9', 'max:15'],
            'ssm_number'    => ['nullable', 'string', 'max:30'],
            'address_line1' => ['required', 'string', 'max:150'],
            'address_line2' => ['nullable', 'string', 'max:150'],
            'address_line3' => ['nullable', 'string', 'max:150'],
            'postcode'      => ['required', 'string', 'regex:/^[0-9]{5}$/'],
            'town'          => ['required', 'string', 'max:100'],
            'state'         => ['required', 'string', 'max:100'],
            'country'       => ['required', 'string', 'max:100'],
            'tenant_type'   => ['required', 'string', Rule::in(['mediator', 'actual_supplier', 'virtual_seller', 'standard_buyer', 'buyer_with_quota', 'auditor'])],
            'status'        => ['required', 'string', Rule::in(['dummy', 'provisional', 'permanent', 'suspended'])],
            'password'      => $passwordRules,
            'parent_id'     => ['nullable', 'integer', 'exists:tenants,id'],
            'settings'      => ['nullable', 'array'],
            'logo_file'     => ['nullable', 'image', 'max:2048'],
        ]);

        $validated['tenant_types'] = [$request->input('tenant_type')];
        unset($validated['tenant_type']);

        $validated['name'] = Str::title($validated['name']);
        $validated['slug'] = Str::slug($validated['slug'] ?: $validated['name']);

        if (! empty($validated['ssm_number'])) {
            $validated['ssm_number'] = Str::upper($validated['ssm_number']);
        }

        if (! empty($validated['contact_phone'])) {
            $digits = preg_replace('/\D+/', '', $validated['contact_phone']);
            $validated['contact_phone'] = strlen($digits) > 3
                ? substr($digits, 0, 3) . '-' . substr($digits, 3)
                : $digits;
        }

        // Remove password and file fields so they are not sent to DB directly
        unset($validated['password'], $validated['password_confirmation'], $validated['logo_file']);

        return $validated;
    }
}
