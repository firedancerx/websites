<?php

namespace App\Policies;

use App\Models\LedgerEntry;
use App\Models\User;

class LedgerEntryPolicy
{
    public function viewAny(User $user): bool
    {
        if ($user->isSuperAdmin() || $user->isEntityUser()) {
            return true;
        }

        return $user->hasRole(['tenant_admin', 'finance_officer']);
    }

    public function view(User $user, LedgerEntry $ledgerEntry): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isEntityUser()) {
            $entityId = $user->entity_id;

            return $ledgerEntry->order?->entity_id === $entityId
                || $ledgerEntry->order?->quota_holder_entity_id === $entityId
                || $ledgerEntry->deposit?->entity_id === $entityId;
        }

        return $user->tenant_id === $ledgerEntry->tenant_id
            && $user->hasRole(['tenant_admin', 'finance_officer']);
    }
}
