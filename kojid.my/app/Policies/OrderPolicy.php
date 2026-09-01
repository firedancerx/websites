<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use App\Services\TenantContextService;

/**
 * OrderPolicy
 *
 * Gates order visibility and state transition permissions.
 * Enforces tenant isolation as the FIRST check on every gate.
 * Role-based gates come second.
 */
class OrderPolicy
{
    /** Any authenticated tenant user can list orders for their tenant. */
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->tenant_id !== null || $user->entity_id !== null;
    }

    /** View a single order — must belong to current tenant. */
    public function view(User $user, Order $order): bool
    {
        return $this->ownsRecord($user, $order);
    }

    /** Create orders — procurement (inbound) or sales (outbound) roles. */
    public function create(User $user): bool
    {
        return $user->hasRole(['tenant_admin', 'procurement_officer', 'sales_officer']);
    }

    /** Transition state — depends on order type and user role. */
    public function update(User $user, Order $order): bool
    {
        if (! $this->ownsTenant($user, $order)) {
            return false;
        }

        if ($user->isEntityUser()) {
            return false;
        }

        if ($user->hasRole('tenant_admin')) {
            return true;
        }

        return match ($order->type) {
            'inbound'  => $user->hasRole(['procurement_officer', 'warehouse_staff']),
            'outbound' => $user->hasRole(['sales_officer', 'finance_officer']),
            default    => false,
        };
    }

    /** Delete is forbidden — orders use soft deletes and are never removed. */
    public function delete(User $user, Order $order): bool
    {
        return false;
    }

    /** Settle an outbound order. */
    public function settle(User $user, Order $order): bool
    {
        return $this->ownsTenant($user, $order)
            && ! $user->isEntityUser()
            && $user->hasRole(['tenant_admin', 'finance_officer']);
    }

    // -------------------------------------------------------------------------
    private function ownsRecord(User $user, Order $order): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isEntityUser()) {
            return $user->entity_id === $order->entity_id
                || $user->entity_id === $order->quota_holder_entity_id;
        }

        return $this->ownsTenant($user, $order);
    }

    private function ownsTenant(User $user, Order $order): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return $user->tenant_id === $order->tenant_id;
    }
}
