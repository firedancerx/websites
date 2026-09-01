<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Tenancy Strategy
    |--------------------------------------------------------------------------
    | KOJID uses single-database row-level tenancy with tenant_id on all
    | tenant-scoped tables. The BelongsToTenant trait enforces this globally.
    */

    'tenant_model' => \App\Models\Tenant::class,

    /*
    |--------------------------------------------------------------------------
    | Tenant Identification
    |--------------------------------------------------------------------------
    | How to resolve the current tenant from a request.
    | KOJID resolves by the authenticated user's tenant_id.
    */

    'tenant_finder' => \App\Services\TenantContextService::class,

    /*
    |--------------------------------------------------------------------------
    | Super Admin Bypass
    |--------------------------------------------------------------------------
    */
    'super_admin_role' => 'super_admin',

    /*
    |--------------------------------------------------------------------------
    | Cache Keys
    |--------------------------------------------------------------------------
    | Redis key patterns for tenant-scoped cache.
    */
    'cache_key_prefix' => 'kojid:tenant:{tenant_id}:',

    /*
    |--------------------------------------------------------------------------
    | Session Key
    |--------------------------------------------------------------------------
    | Session key storing the resolved tenant ID.
    */
    'session_key' => 'current_tenant_id',

];
