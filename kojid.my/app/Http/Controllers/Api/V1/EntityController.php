<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Entity;
use App\Models\EntityRole;
use App\Services\TenantContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EntityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Entity::class);

        $entities = Entity::with('activeRoles')
            ->visibleTo($request->user())
            ->when($request->type, fn ($q, $type) => $q->where('entity_type', $type))
            ->orderBy('name')
            ->paginate(25);

        return response()->json(['data' => $entities]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Entity::class);

        $tenant = TenantContextService::current();
        $validated = $request->validate($this->rules($tenant->id));

        $entity = Entity::create(array_merge($validated, ['tenant_id' => $tenant->id]));

        EntityRole::create([
            'entity_id' => $entity->id,
            'tenant_id' => $tenant->id,
            'role' => $validated['entity_type'],
            'is_primary' => true,
            'created_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $entity->load('activeRoles')], 201);
    }

    public function show(Entity $entity): JsonResponse
    {
        $this->authorize('view', $entity);

        return response()->json(['data' => $entity->load(['activeRoles', 'inboundOrders', 'outboundOrders', 'deposits'])]);
    }

    public function update(Request $request, Entity $entity): JsonResponse
    {
        $this->authorize('update', $entity);

        $validated = $request->validate($this->rules($entity->tenant_id, $entity->id, true));
        $entity->update($validated);

        return response()->json(['data' => $entity->fresh('activeRoles')]);
    }

    private function rules(int $tenantId, ?int $entityId = null, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:150'],
            'ssm_number' => [
                $required,
                'string',
                'max:30',
                Rule::unique('entities')->where('tenant_id', $tenantId)->ignore($entityId),
            ],
            'ic_owner' => ['nullable', 'string', 'max:20'],
            'entity_type' => [$required, 'in:supplier,buyer,quota_holder,intermediary'],
            'bank_account' => ['nullable', 'string', 'max:30'],
            'bank_name' => ['nullable', 'string', 'max:60'],
            'contact_phone' => [$required, 'string', 'max:20'],
            'contact_email' => ['nullable', 'email'],
            'address' => ['nullable', 'string', 'max:500'],
            'credit_terms' => ['nullable', 'in:cod,net7,net14,net30,custom'],
            'credit_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'deposit_rate_override' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
