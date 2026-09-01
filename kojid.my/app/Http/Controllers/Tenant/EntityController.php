<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Entity\RegisterEntityRequest;
use App\Models\Entity;
use App\Models\EntityRole;
use App\Services\KycService;
use App\Services\TenantContextService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

/**
 * EntityController — manages the entity (counterparty) registry for a tenant.
 * Includes Quantum Actor role assignment and KYC management.
 */
class EntityController extends Controller
{
    public function __construct(private readonly KycService $kycService) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Entity::class);
        $canCreateEntity = TenantContextService::current() !== null
            && $request->user()->can('create', Entity::class);

        $entities = Entity::with('activeRoles')
            ->visibleTo($request->user())
            ->when($request->search, fn ($q, $s) =>
                $q->where(function ($searchQuery) use ($s) {
                    $searchQuery->where('name', 'like', "%{$s}%")
                        ->orWhere('ssm_number', 'like', "%{$s}%");
                })
            )
            ->when($request->type, fn ($q, $t) => $q->where('entity_type', $t))
            ->when($request->verified, fn ($q) => $q->verified())
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        return view('entities.index', compact('entities', 'canCreateEntity'));
    }

    public function create()
    {
        $this->authorize('create', Entity::class);
        abort_if(TenantContextService::current() === null, 403, 'Please select a tenant before registering an entity.');

        return view('entities.create');
    }

    public function pdf(Request $request)
    {
        $this->authorize('viewAny', Entity::class);

        $entities = Entity::with(['tenant', 'activeRoles'])
            ->visibleTo($request->user())
            ->when($request->search, fn ($query, $search) =>
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('ssm_number', 'like', "%{$search}%");
                })
            )
            ->when($request->type, fn ($query, $type) => $query->where('entity_type', $type))
            ->orderBy('name')
            ->get();

        return Pdf::loadView('entities.pdf', [
            'entities' => $entities,
            'generatedAt' => now(),
        ])->setPaper('a4', 'portrait')
          ->download('entities-report-' . now()->format('Ymd-His') . '.pdf');
    }

    public function store(RegisterEntityRequest $request)
    {
        $tenant = TenantContextService::current();
        abort_if($tenant === null, 403, 'Please select a tenant before registering an entity.');

        $entity = Entity::create(array_merge($request->validated(), ['tenant_id' => $tenant->id]));

        // Assign primary role
        EntityRole::create([
            'entity_id'  => $entity->id,
            'tenant_id'  => $tenant->id,
            'role'       => $request->entity_type,
            'is_primary' => true,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('entities.show', $entity)
            ->with('success', __('entities.registered_successfully'));
    }

    public function show(Entity $entity)
    {
        $this->authorize('view', $entity);
        $entity->load(['activeRoles', 'verifiedBy', 'inboundOrders' => fn ($q) => $q->limit(5),
                       'outboundOrders' => fn ($q) => $q->limit(5), 'deposits' => fn ($q) => $q->limit(10)]);

        return view('entities.show', compact('entity'));
    }

    public function approveKyc(Entity $entity)
    {
        $this->authorize('approveKyc', $entity);
        $this->kycService->approve($entity, auth()->user());
        return back()->with('success', __('entities.kyc_approved'));
    }

    public function blacklist(Request $request, Entity $entity)
    {
        $this->authorize('blacklist', $entity);
        $request->validate(['reason' => ['required', 'string', 'min:10']]);
        $this->kycService->blacklist($entity, $request->reason, auth()->user());
        return back()->with('success', __('entities.blacklisted'));
    }

    public function unblacklist(Entity $entity)
    {
        $this->authorize('blacklist', $entity);
        $this->kycService->unblacklist($entity, auth()->user());
        return back()->with('success', __('entities.unblacklisted'));
    }
}
