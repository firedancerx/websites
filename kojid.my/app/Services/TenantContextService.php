<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Exceptions\UnauthorizedTenantAccessException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

/**
 * TenantContextService
 *
 * Resolves the current tenant from the authenticated user.
 * Super admins (tenant_id = NULL) can impersonate any tenant via
 * setActiveTenant(). All other users are locked to their own tenant.
 *
 * Acts as the single source of truth for "which tenant am I operating as?"
 * throughout the request lifecycle.
 */
class TenantContextService
{
    private static ?Tenant $currentTenant = null;

    /**
     * Resolve and return the current tenant.
     * Caches the result for the duration of the request.
     *
     * @throws UnauthorizedTenantAccessException if no tenant can be resolved
     */
    public static function current(): ?Tenant
    {
        if (static::$currentTenant !== null) {
            return static::$currentTenant;
        }

        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            return null;
        }

        // Super admin: check session for impersonated tenant
        if ($user->isSuperAdmin()) {
            if (static::isImpersonating()) {
                $impersonatedId = session(config('multitenancy.session_key')) ?? session('impersonated_tenant_id');
                if ($impersonatedId) {
                    static::$currentTenant = Tenant::find($impersonatedId);
                }
            } else {
                static::$currentTenant = null;
            }
            return static::$currentTenant;
        }

        // Regular user: always their own tenant
        static::$currentTenant = $user->tenant;

        if (! static::$currentTenant?->is_active) {
            throw new UnauthorizedTenantAccessException(
                'Your organisation account is suspended. Contact the platform administrator.'
            );
        }

        return static::$currentTenant;
    }

    /**
     * Get the current tenant ID (convenience method).
     */
    public static function currentId(): ?int
    {
        return static::current()?->id;
    }

    /**
     * Super-admin only: set the active tenant for impersonation.
     *
     * @throws UnauthorizedTenantAccessException if caller is not super admin
     */
    public static function setActiveTenant(int $tenantId): Tenant
    {
        /** @var User $user */
        $user = Auth::user();

        if (! $user->isSuperAdmin()) {
            throw new UnauthorizedTenantAccessException('Only super admins can switch tenant context.');
        }

        $tenant = Tenant::findOrFail($tenantId);
        session([config('multitenancy.session_key') => $tenantId]);
        static::$currentTenant = $tenant;

        return $tenant;
    }

    /**
     * Assert that a given tenant_id matches the current tenant.
     * Called by EnsureTenantContext middleware on every resource access.
     *
     * @throws UnauthorizedTenantAccessException
     */
    public static function assertOwnership(int $resourceTenantId): void
    {
        $currentId = static::currentId();

        // Super admins can see everything
        if (Auth::user()?->isSuperAdmin()) {
            return;
        }

        if ($currentId !== $resourceTenantId) {
            throw new UnauthorizedTenantAccessException();
        }
    }

    /**
     * Reset the resolved tenant — called at start of each request.
     */
    public static function reset(): void
    {
        static::$currentTenant = null;
    }

    /**
     * Check if currently impersonating a tenant.
     * Only SuperAdmin can impersonate, and only when an active impersonated tenant ID is set in session.
     */
    public static function isImpersonating(): bool
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user || ! $user->isSuperAdmin()) {
            return false;
        }

        $sessionKey = config('multitenancy.session_key', 'active_tenant_id');
        $impersonatedId = session($sessionKey) ?? session('impersonated_tenant_id');

        if (! $impersonatedId) {
            return false;
        }

        if ($user->tenant_id !== null && (int)$user->tenant_id === (int)$impersonatedId) {
            return false;
        }

        return (bool) session('is_impersonating', false) || session()->has($sessionKey);
    }

    /**
     * Get tenant settings with fallback — convenience proxy.
     */
    public static function getSetting(string $key, mixed $default = null): mixed
    {
        return static::current()?->getSetting($key, $default) ?? $default;
    }
}
