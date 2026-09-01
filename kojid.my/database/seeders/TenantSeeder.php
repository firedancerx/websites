<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * TenantSeeder
 *
 * Seeds the demo tenant and its admin user.
 * Also creates the platform super admin user.
 */
class TenantSeeder extends Seeder
{
    public function run(): void
    {
        // ── Super Admin (no tenant) ──────────────────────────────────────────
        $superAdmin = User::firstOrCreate(
            ['email' => 'superadmin@kojid.com.my'],
            [
                'name'       => 'KOJID Super Admin',
                'password'   => Hash::make('SuperAdmin@2026!'),
                'tenant_id'  => null,
                'locale'     => 'ms',
                'is_active'  => true,
            ]
        );
        $superAdmin->assignRole('super_admin');
        $this->command->info('Super admin: superadmin@kojid.com.my / SuperAdmin@2026!');

        // ── Demo Tenant ──────────────────────────────────────────────────────
        $tenant = Tenant::firstOrCreate(
            ['slug' => 'demo-sdn-bhd'],
            [
                'name'          => 'Demo Trading Sdn Bhd',
                'is_active'     => true,
                'contact_email' => 'admin@demo-trading.com.my',
                'contact_phone' => '03-12345678',
                'settings'      => [
                    'deposit_rate_default' => 30.00,
                    'sla_timers' => [
                        'inbound' => [
                            'pending_acceptance' => 24,
                            'deposit_committed'  => 48,
                            'pending_delivery'   => 72,
                        ],
                        'outbound' => [
                            'pending_buyer_deposit' => 12,
                            'deposit_confirmed'     => 24,
                            'in_transit'            => 48,
                        ],
                    ],
                    'guillotine_hours' => [4, 1],
                ],
            ]
        );

        // ── Tenant Admin ─────────────────────────────────────────────────────
        $tenantAdmin = User::firstOrCreate(
            ['email' => 'admin@demo-trading.com.my'],
            [
                'name'      => 'Encik Demo Admin',
                'password'  => Hash::make('TenantAdmin@2026!'),
                'tenant_id' => $tenant->id,
                'locale'    => 'ms',
                'is_active' => true,
            ]
        );
        $tenantAdmin->assignRole('tenant_admin');

        // ── Procurement Officer ──────────────────────────────────────────────
        $procurement = User::firstOrCreate(
            ['email' => 'procurement@demo-trading.com.my'],
            [
                'name'      => 'Encik Perolehan',
                'password'  => Hash::make('Procurement@2026!'),
                'tenant_id' => $tenant->id,
                'locale'    => 'ms',
                'is_active' => true,
            ]
        );
        $procurement->assignRole('procurement_officer');

        // ── Finance Officer ──────────────────────────────────────────────────
        $finance = User::firstOrCreate(
            ['email' => 'finance@demo-trading.com.my'],
            [
                'name'      => 'Puan Kewangan',
                'password'  => Hash::make('Finance@2026!'),
                'tenant_id' => $tenant->id,
                'locale'    => 'ms',
                'is_active' => true,
            ]
        );
        $finance->assignRole('finance_officer');

        $this->command->info("Demo tenant: {$tenant->name} (ID: {$tenant->id})");
        $this->command->info('Tenant admin: admin@demo-trading.com.my / TenantAdmin@2026!');
    }
}
