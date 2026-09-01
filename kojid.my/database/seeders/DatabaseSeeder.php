<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * DatabaseSeeder — master seeder, runs all seeders in dependency order.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,  // Must run first — users need roles
            TenantSeeder::class,          // Creates tenant + users
            ProductCategorySeeder::class, // Needs tenant to exist
            DemoDataSeeder::class,        // Needs everything above
        ]);

        $this->command->info('');
        $this->command->info('✓ KOJID database seeded successfully.');
        $this->command->info('  Super Admin:  superadmin@kojid.com.my / SuperAdmin@2026!');
        $this->command->info('  Tenant Admin: admin@demo-trading.com.my / TenantAdmin@2026!');
    }
}
