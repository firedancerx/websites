<?php

namespace App\Policies;

use App\Models\Entity;
use App\Models\User;

/**
 * EntityPolicy — gates entity (counterparty) management.
 */
class EntityPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isSuperAdmin() || $user->tenant_id !== null || $user->entity_id !== null;
    }

    public function view(User $user, Entity $entity): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if ($user->isEntityUser()) {
            return $user->entity_id === $entity->id;
        }

        return $user->tenant_id === $entity->tenant_id;
    }

    public function create(User $user): bool
    {
        return $user->hasRole('tenant_admin');
    }

    public function update(User $user, Entity $entity): bool
    {
        return $this->view($user, $entity) && $user->hasRole('tenant_admin');
    }

    public function approveKyc(User $user, Entity $entity): bool
    {
        return $this->view($user, $entity) && $user->hasRole('tenant_admin');
    }

    public function blacklist(User $user, Entity $entity): bool
    {
        return $this->view($user, $entity) && $user->hasRole('tenant_admin');
    }

    public function delete(User $user, Entity $entity): bool
    {
        return false; // Never hard-delete entities
    }
}
