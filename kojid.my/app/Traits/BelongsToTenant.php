<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * BelongsToTenant
 *
 * Apply to every Eloquent model that is scoped to a tenant.
 * Adds a global query scope that automatically filters all queries
 * to the current authenticated user's tenant_id.
 *
 * Super admins (tenant_id = NULL) bypass the scope via withoutTenantScope().
 */
trait BelongsToTenant
{
    /**
     * Boot the trait — register global scope and auto-assign tenant_id on create.
     */
    public static function bootBelongsToTenant(): void
    {
        // Auto-inject tenant_id on model creation
        static::creating(function ($model) {
            if (empty($model->tenant_id)) {
                $tenantId = static::resolveTenantId();
                if ($tenantId) {
                    $model->tenant_id = $tenantId;
                }
            }
        });

        // Apply global tenant scope to all queries supporting downwards hierarchy visibility
        static::addGlobalScope('tenant', function (Builder $builder) {
            $user = Auth::user();
            if ($user && !$user->hasRole('super_admin')) {
                $tenantId = $user->tenant_id;
                if ($tenantId !== null) {
                    static $tenantHierarchy = [];
                    if (!isset($tenantHierarchy[$tenantId])) {
                        $parentId = \Illuminate\Support\Facades\DB::table('tenants')
                            ->where('id', $tenantId)
                            ->value('parent_id');

                        $ids = [$tenantId];
                        if ($parentId === null) {
                            $subtenantIds = \Illuminate\Support\Facades\DB::table('tenants')
                                ->where('parent_id', $tenantId)
                                ->pluck('id')
                                ->toArray();
                            $ids = array_merge($ids, $subtenantIds);
                        }
                        $tenantHierarchy[$tenantId] = $ids;
                    }

                    $builder->whereIn($builder->getModel()->getTable() . '.tenant_id', $tenantHierarchy[$tenantId]);
                }
            }
        });
    }

    /**
     * Resolve the current tenant ID from the authenticated user.
     */
    protected static function resolveTenantId(): ?int
    {
        $user = Auth::user();

        if (! $user) {
            return null;
        }

        // Super admins have no tenant_id — they bypass scoping
        if ($user->hasRole('super_admin')) {
            return null;
        }

        return $user->tenant_id;
    }

    /**
     * Remove the tenant scope — used by Super Admin queries only.
     */
    public static function withoutTenantScope(): Builder
    {
        return static::withoutGlobalScope('tenant');
    }

    /**
     * Relationship to the owning tenant.
     */
    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }
}
