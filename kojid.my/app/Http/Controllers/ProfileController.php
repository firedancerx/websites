<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Services\NavigationMenuService;

class ProfileController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isImpersonating = \App\Services\TenantContextService::isImpersonating();
        $currentTenant = \App\Services\TenantContextService::current();

        if ($isImpersonating && $currentTenant) {
            $tenant = $currentTenant;
            $tenantUser = \App\Models\User::where('tenant_id', $tenant->id)->first() ?? $user;
            $role = NavigationMenuService::resolveRole($tenantUser, $tenant);

            $upline = null;
            if ($tenant->parent_id) {
                $upline = DB::table('tenants')->where('id', $tenant->parent_id)->first();
            } else {
                $upline = DB::table('tenants')->where('id', 1)->first();
            }

            return view('profile.index', [
                'user' => $tenantUser,
                'tenant' => $tenant,
                'role' => $role,
                'upline' => $upline,
                'isImpersonating' => true,
            ]);
        }

        $tenant = $user->tenant;
        $role = NavigationMenuService::resolveRole($user, $tenant);

        $upline = null;
        if ($tenant && $tenant->parent_id) {
            $upline = DB::table('tenants')->where('id', $tenant->parent_id)->first();
        } else {
            $rootEmail = DB::table('systemwide_settings')->where('setting_key', 'sole_super_admin_email')->value('setting_value') ?? NavigationMenuService::SOLE_SUPER_ADMIN_EMAIL;
            $upline = (object)[
                'name' => 'Platform Root Super Admin',
                'contact_email' => $rootEmail,
                'contact_phone' => '+60 3-8000 1000',
                'role_label' => 'Sole Platform Root Super Admin',
            ];
        }

        return view('profile.index', compact('user', 'tenant', 'role', 'upline'));
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'locale' => ['required', 'string', 'in:ms,en'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->locale = $validated['locale'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        session(['locale' => $validated['locale']]);
        cookie()->queue('locale', $validated['locale'], 60 * 24 * 365);
        app()->setLocale($validated['locale']);

        return back()->with('success', app()->getLocale() === 'ms' ? 'Profil akaun anda berjaya dikemas kini!' : 'Account profile successfully updated!');
    }
}
