<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
*/

uses(
    Tests\TestCase::class,
    RefreshDatabase::class,
)->in('Feature');

uses(Tests\TestCase::class)->in('Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeValidMyrAmount', function () {
    return $this->toMatch('/^\d+\.\d{2}$/');
});

expect()->extend('toBeOrderNumber', function (string $type = 'inbound') {
    $prefix = $type === 'inbound' ? 'MSK' : 'KLR';
    return $this->toMatch("/^{$prefix}-\d{4}-\d{4}-\d{5}$/");
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
*/

function actingAsTenantAdmin(App\Models\Tenant $tenant): App\Models\User
{
    (new Database\Seeders\RolePermissionSeeder())->run();
    $user = App\Models\User::factory()->forTenant($tenant)->create();
    $user->assignRole('tenant_admin');
    test()->actingAs($user);
    return $user;
}

function actingAsFinanceOfficer(App\Models\Tenant $tenant): App\Models\User
{
    (new Database\Seeders\RolePermissionSeeder())->run();
    $user = App\Models\User::factory()->forTenant($tenant)->create();
    $user->assignRole('finance_officer');
    test()->actingAs($user);
    return $user;
}
