<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/**
 * RolePermissionSeeder
 *
 * Seeds all predefined KOJID roles and their permissions.
 *
 * Roles:
 *   super_admin         — Platform owner; all access, cross-tenant
 *   tenant_admin        — Business owner; full access within tenant
 *   procurement_officer — Manage inbound orders, suppliers, deposits
 *   sales_officer       — Manage outbound orders, buyers, pricing
 *   warehouse_staff     — Receive goods, update stock status
 *   finance_officer     — Ledger, settlements, deposit approvals
 *   external_supplier   — View their own inbound orders only
 *   external_buyer      — View their own outbound orders, pay deposits
 */
class RolePermissionSeeder extends Seeder
{
    private const PERMISSIONS = [
        // Orders
        'orders.view',        'orders.create',    'orders.transition',
        'orders.cancel',      'orders.settle',
        // Entities
        'entities.view',      'entities.create',  'entities.edit',
        'entities.kyc.approve', 'entities.blacklist',
        // Deposits
        'deposits.view',      'deposits.record',
        'deposits.approve_refund', 'deposits.finance_approve',
        // Ledger
        'ledger.view',        'ledger.export',
        // Reports
        'reports.view',       'reports.export',
        // Admin
        'settings.view',      'settings.edit',
        'users.view',         'users.create',     'users.edit',   'users.deactivate',
        'products.view',      'products.create',  'products.edit',
        // Super Admin
        'tenants.view',       'tenants.create',   'tenants.edit', 'tenants.suspend',
        'platform.audit',
    ];

    private const ROLE_PERMISSIONS = [
        'super_admin' => '*', // all permissions

        'tenant_admin' => [
            'orders.view', 'orders.create', 'orders.transition', 'orders.cancel', 'orders.settle',
            'entities.view', 'entities.create', 'entities.edit', 'entities.kyc.approve', 'entities.blacklist',
            'deposits.view', 'deposits.record', 'deposits.approve_refund',
            'ledger.view', 'ledger.export',
            'reports.view', 'reports.export',
            'settings.view', 'settings.edit',
            'users.view', 'users.create', 'users.edit', 'users.deactivate',
            'products.view', 'products.create', 'products.edit',
        ],

        'procurement_officer' => [
            'orders.view', 'orders.create', 'orders.transition', 'orders.cancel',
            'entities.view', 'entities.create', 'entities.edit',
            'deposits.view', 'deposits.record',
            'products.view',
        ],

        'sales_officer' => [
            'orders.view', 'orders.create', 'orders.transition',
            'entities.view', 'entities.create', 'entities.edit',
            'deposits.view', 'deposits.record',
            'products.view',
        ],

        'warehouse_staff' => [
            'orders.view', 'orders.transition',
            'entities.view',
            'products.view',
        ],

        'finance_officer' => [
            'orders.view', 'orders.settle',
            'entities.view',
            'deposits.view', 'deposits.record', 'deposits.approve_refund', 'deposits.finance_approve',
            'ledger.view', 'ledger.export',
            'reports.view', 'reports.export',
        ],

        'external_supplier' => [
            'orders.view', 'entities.view', 'deposits.view',
        ],

        'external_buyer' => [
            'orders.view', 'entities.view', 'deposits.view', 'deposits.record',
        ],

        'external_quota_holder' => [
            'orders.view', 'entities.view', 'deposits.view',
        ],
    ];

    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create all permissions
        foreach (self::PERMISSIONS as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // Create roles and assign permissions
        foreach (self::ROLE_PERMISSIONS as $roleName => $permissions) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);

            if ($permissions === '*') {
                $role->syncPermissions(Permission::all());
            } else {
                $role->syncPermissions($permissions);
            }

            $this->command?->line("  Role '{$roleName}': " .
                ($permissions === '*' ? 'all permissions' : count($permissions) . ' permissions'));
        }
    }
}
