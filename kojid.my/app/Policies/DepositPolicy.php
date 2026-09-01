<?php

namespace App\Policies;

use App\Models\Deposit;
use App\Models\User;

class DepositPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->tenant_id !== null || $user->entity_id !== null;
    }

    public function view(User $user, Deposit $deposit): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isEntityUser()) {
            return $user->entity_id === $deposit->entity_id;
        }

        return $user->tenant_id === $deposit->tenant_id;
    }

    public function approveRefund(User $user, Deposit $deposit): bool
    {
        return $this->view($user, $deposit)
            && ! $user->isEntityUser()
            && $user->hasRole('tenant_admin');
    }

    public function financeApproveRefund(User $user, Deposit $deposit): bool
    {
        return $this->view($user, $deposit)
            && ! $user->isEntityUser()
            && $user->hasRole('finance_officer');
    }
}
