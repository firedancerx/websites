<?php

namespace App\Http\Middleware;

use App\Services\TenantContextService;
use App\Exceptions\UnauthorizedTenantAccessException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureTenantContext
 *
 * Applied to every authenticated route.
 * 1. Resolves the current tenant from the authenticated user.
 * 2. For resource routes containing {tenant_id} or model bindings,
 *    asserts the resource belongs to the current tenant.
 * 3. Resets the static tenant context at the start of each request
 *    to prevent stale data leaking between requests in long-running processes.
 */
class EnsureTenantContext
{
    public function handle(Request $request, Closure $next): Response
    {
        // Reset cached tenant at start of every request
        TenantContextService::reset();

        try {
            $tenant = TenantContextService::current();

            // If authenticated but no tenant context (not super_admin), deny
            if ($request->user() && ! $request->user()->isSuperAdmin() && ! $tenant) {
                abort(403, 'No tenant context available for your account.');
            }

            // Share tenant with all views for layout rendering
            if ($tenant) {
                view()->share('currentTenant', $tenant);
            }

        } catch (UnauthorizedTenantAccessException $e) {
            abort(403, $e->getMessage());
        }

        return $next($request);
    }
}
