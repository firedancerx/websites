<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class TenantBulkSeeder extends Seeder
{
    public function run(): void
    {
        $masterTenant = Tenant::whereNull('parent_id')->first();
        if (!$masterTenant) {
            $this->command->error('Master tenant not found. Please run the default seeders first.');
            return;
        }

        $this->command->info('Cleaning up existing dummy tenants and users...');

        // 1. Delete users belonging to dummy tenants
        $dummyTenantIds = Tenant::withTrashed()->where('status', 'dummy')->pluck('id')->toArray();
        if (!empty($dummyTenantIds)) {
            User::withTrashed()->whereIn('tenant_id', $dummyTenantIds)->forceDelete();
        }

        // 2. Delete child subtenants first to satisfy foreign key constraints
        Tenant::withTrashed()->whereIn('parent_id', $dummyTenantIds)->forceDelete();

        // 3. Delete top level dummy tenants
        Tenant::withTrashed()->where('status', 'dummy')->forceDelete();

        $this->command->info('Seeding 10 Top-Level Tenants under master tenant...');

        $topLevelData = [
            [
                'name' => 'Malayan Agricultural Products Sdn Bhd',
                'address_line1' => 'Lot 45, Jalan Utas 15/7',
                'address_line2' => 'Seksyen 15',
                'postcode' => '40200',
                'town' => 'Shah Alam',
                'state' => 'Selangor',
                'contact_phone' => '+60 3-5519 2831',
            ],
            [
                'name' => 'Borneo Timber & Resources Sdn Bhd',
                'address_line1' => 'Wisma Timber, 12 Jalan Datuk Abang Abdul Rahim',
                'address_line2' => '',
                'postcode' => '93450',
                'town' => 'Kuching',
                'state' => 'Sarawak',
                'contact_phone' => '+60 82-421 990',
            ],
            [
                'name' => 'Penang Electronics Manufacturing Sdn Bhd',
                'address_line1' => '120, Lorong Perusahaan Baru 4',
                'address_line2' => 'Perai Industrial Estate',
                'postcode' => '13600',
                'town' => 'Perai',
                'state' => 'Pulau Pinang',
                'contact_phone' => '+60 4-390 1255',
            ],
            [
                'name' => 'Johor Logistics Services Sdn Bhd',
                'address_line1' => 'Plo 231, Jalan Tembaga Dua',
                'address_line2' => 'Kawasan Perindustrian Pasir Gudang',
                'postcode' => '81700',
                'town' => 'Pasir Gudang',
                'state' => 'Johor',
                'contact_phone' => '+60 7-251 3344',
            ],
            [
                'name' => 'Kuala Lumpur Commodity Trading Sdn Bhd',
                'address_line1' => 'Level 18, Menara IMC',
                'address_line2' => '8 Jalan Sultan Ismail',
                'postcode' => '50250',
                'town' => 'Kuala Lumpur',
                'state' => 'Wilayah Persekutuan Kuala Lumpur',
                'contact_phone' => '+60 3-2031 8899',
            ],
            [
                'name' => 'Perak Steel Industries Sdn Bhd',
                'address_line1' => 'Lot 1582, Jalan Lapangan Terbang',
                'address_line2' => '',
                'postcode' => '31350',
                'town' => 'Ipoh',
                'state' => 'Perak',
                'contact_phone' => '+60 5-312 8877',
            ],
            [
                'name' => 'Sabah Cocoa Producers Sdn Bhd',
                'address_line1' => 'Mile 4, Apas Road',
                'address_line2' => 'Industrial Estate',
                'postcode' => '91000',
                'town' => 'Tawau',
                'state' => 'Sabah',
                'contact_phone' => '+60 89-772 443',
            ],
            [
                'name' => 'Pahang Palm Oil Mills Sdn Bhd',
                'address_line1' => 'Kawasan Perindustrian Semambu',
                'address_line2' => 'Jalan Semambu',
                'postcode' => '25350',
                'town' => 'Kuantan',
                'state' => 'Pahang',
                'contact_phone' => '+60 9-566 1122',
            ],
            [
                'name' => 'Melaka Food Processing Sdn Bhd',
                'address_line1' => 'Lot 88, Kawasan Perindustrian Cheng',
                'address_line2' => '',
                'postcode' => '75250',
                'town' => 'Melaka',
                'state' => 'Melaka',
                'contact_phone' => '+60 6-335 5566',
            ],
            [
                'name' => 'Kedah Rice Millers Sdn Bhd',
                'address_line1' => 'Batu 5, Jalan Langgar',
                'address_line2' => '',
                'postcode' => '05460',
                'town' => 'Alor Setar',
                'state' => 'Kedah',
                'contact_phone' => '+60 4-733 9988',
            ]
        ];

        $topTenants = [];
        $allRoles = ['actual_supplier', 'virtual_seller', 'standard_buyer', 'buyer_with_quota', 'auditor'];

        foreach ($topLevelData as $index => $data) {
            $slug = Str::slug($data['name']);
            $emailName = str_replace('-', '.', $slug);

            $tenant = Tenant::create([
                'parent_id' => $masterTenant->id,
                'name' => $data['name'],
                'slug' => $slug,
                'is_active' => true,
                'logo_path' => null,
                'contact_email' => "{$emailName}@kojid.com.my",
                'contact_phone' => $data['contact_phone'],
                'address_line1' => $data['address_line1'],
                'address_line2' => $data['address_line2'] ?: null,
                'address_line3' => null,
                'postcode' => $data['postcode'],
                'town' => $data['town'],
                'state' => $data['state'],
                'country' => 'Malaysia',
                'ssm_number' => 'SSM-' . strtoupper(Str::random(8)),
                'subscription_expires_at' => now()->addYear(),
                'tenant_types' => $allRoles, // all roles enabled
                'status' => 'dummy', // type dummy
                'settings' => [
                    'deposit_rate_default' => 30.00,
                    'sla_timers' => [
                        'inbound' => [
                            'pending_acceptance' => 24,
                            'deposit_committed' => 48,
                            'pending_delivery' => 72,
                        ],
                        'outbound' => [
                            'pending_buyer_deposit' => 12,
                            'deposit_confirmed' => 24,
                            'in_transit' => 48,
                        ]
                    ]
                ]
            ]);

            $topTenants[] = $tenant;

            // Create User for this top-level tenant
            $user = User::create([
                'tenant_id' => $tenant->id,
                'name' => $tenant->name . ' Admin',
                'email' => "admin.{$tenant->slug}@kojid.com.my",
                'password' => Hash::make('KojidAdmin@2026!'),
                'locale' => 'ms',
                'is_active' => true,
            ]);
            $user->assignRole('tenant_admin');
        }

        $this->command->info('Seeding 100 subtenants partitioned under the 10 top-level tenants...');

        // Malaysian towns/postcodes pool for subtenants
        $locations = [
            ['town' => 'Petaling Jaya', 'state' => 'Selangor', 'postcode' => '46200'],
            ['town' => 'Subang Jaya', 'state' => 'Selangor', 'postcode' => '47500'],
            ['town' => 'Klang', 'state' => 'Selangor', 'postcode' => '41050'],
            ['town' => 'Bayan Lepas', 'state' => 'Pulau Pinang', 'postcode' => '11900'],
            ['town' => 'Batu Pahat', 'state' => 'Johor', 'postcode' => '83000'],
            ['town' => 'Muar', 'state' => 'Johor', 'postcode' => '84000'],
            ['town' => 'Taiping', 'state' => 'Perak', 'postcode' => '34000'],
            ['town' => 'Teluk Intan', 'state' => 'Perak', 'postcode' => '36000'],
            ['town' => 'Sandakan', 'state' => 'Sabah', 'postcode' => '90000'],
            ['town' => 'Miri', 'state' => 'Sarawak', 'postcode' => '98000'],
            ['town' => 'Sibu', 'state' => 'Sarawak', 'postcode' => '96000'],
            ['town' => 'Temerloh', 'state' => 'Pahang', 'postcode' => '28000'],
            ['town' => 'Cukai', 'state' => 'Terengganu', 'postcode' => '24000'],
            ['town' => 'Kuala Terengganu', 'state' => 'Terengganu', 'postcode' => '20000'],
            ['town' => 'Kota Bharu', 'state' => 'Kelantan', 'postcode' => '15000'],
            ['town' => 'Sungai Petani', 'state' => 'Kedah', 'postcode' => '08000'],
            ['town' => 'Kulim', 'state' => 'Kedah', 'postcode' => '09000'],
            ['town' => 'Kangar', 'state' => 'Perlis', 'postcode' => '01000'],
            ['town' => 'Seremban', 'state' => 'Negeri Sembilan', 'postcode' => '70000'],
            ['town' => 'Port Dickson', 'state' => 'Negeri Sembilan', 'postcode' => '71000'],
        ];

        $prefixes = [
            'Apex', 'Global', 'Sinaran', 'Hup Seng', 'Cemerlang', 'Utama', 'Emas', 'Maju', 'Sinar', 'Wawasan',
            'Padu', 'Mesra', 'Setia', 'Jaya', 'Pertiwi', 'Bintang', 'Ria', 'Mega', 'Bestari', 'Saujana'
        ];

        $industries = [
            'Trading', 'Logistics', 'Ventures', 'Holdings', 'Foods', 'Suppliers', 'Agro', 'Enterprise', 'Solutions', 'Services'
        ];

        $subtenantCount = 0;
        foreach ($topTenants as $topTenant) {
            $rolesMatrix = [
                ['actual_supplier'],
                ['virtual_seller'],
                ['standard_buyer'],
                ['buyer_with_quota'],
                ['auditor'],
                ['actual_supplier', 'virtual_seller'],
                ['standard_buyer', 'buyer_with_quota'],
                ['auditor'],
                ['actual_supplier'],
                ['standard_buyer'],
            ];

            for ($i = 0; $i < 10; $i++) {
                $subtenantCount++;
                $name = $prefixes[array_rand($prefixes)] . ' ' . $industries[array_rand($industries)] . ' ' . Str::random(3) . ' Sdn Bhd';
                $slug = Str::slug($name) . '-' . $subtenantCount;
                $emailName = str_replace('-', '.', Str::slug($name));
                
                $loc = $locations[array_rand($locations)];
                $phonePrefix = ['+60 3', '+60 12', '+60 13', '+60 17', '+60 19', '+60 11', '+60 18', '+60 14'];
                $randPhone = $phonePrefix[array_rand($phonePrefix)] . '-' . rand(100, 999) . ' ' . rand(1000, 9999);

                $tenant = Tenant::create([
                    'parent_id' => $topTenant->id,
                    'name' => $name,
                    'slug' => $slug,
                    'is_active' => true,
                    'logo_path' => null,
                    'contact_email' => "{$emailName}@kojid.com.my",
                    'contact_phone' => $randPhone,
                    'address_line1' => 'No. ' . rand(1, 200) . ', Jalan Industri ' . rand(1, 10),
                    'address_line2' => 'Kawasan Perindustrian',
                    'address_line3' => null,
                    'postcode' => $loc['postcode'],
                    'town' => $loc['town'],
                    'state' => $loc['state'],
                    'country' => 'Malaysia',
                    'ssm_number' => 'SSM-SUB-' . strtoupper(Str::random(6)),
                    'subscription_expires_at' => now()->addYear(),
                    'tenant_types' => $rolesMatrix[$i], // varying roles
                    'status' => 'dummy', // type dummy
                    'settings' => [
                        'deposit_rate_default' => 30.00,
                    ]
                ]);

                // Create User for this subtenant
                $user = User::create([
                    'tenant_id' => $tenant->id,
                    'name' => $tenant->name . ' Admin',
                    'email' => "admin.{$tenant->slug}@kojid.com.my",
                    'password' => Hash::make('KojidSub@2026!'),
                    'locale' => 'ms',
                    'is_active' => true,
                ]);
                $user->assignRole('tenant_admin');
            }
        }

        $this->command->info("✓ Successfully seeded 10 Top Level tenants, 100 subtenants, and their associated users.");
    }
}
