<?php

namespace Database\Seeders;

use App\Models\Entity;
use App\Models\EntityRole;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStateLog;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * DemoDataSeeder
 *
 * Creates realistic demo entities and orders for UAT.
 * All orders are in various states to demonstrate the full state machine.
 */
class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'demo-sdn-bhd')->firstOrFail();
        $admin  = User::where('email', 'admin@demo-trading.com.my')->firstOrFail();

        // ── Suppliers ────────────────────────────────────────────────────────
        $supplier1 = Entity::firstOrCreate(
            ['tenant_id' => $tenant->id, 'ssm_number' => 'SSM-001-DEMO'],
            [
                'name'          => 'Ladang Padi Maju Sdn Bhd',
                'entity_type'   => 'supplier',
                'contact_phone' => '04-4411234',
                'credit_terms'  => 'cod',
                'verified_at'   => now(),
                'verified_by'   => $admin->id,
            ]
        );

        $supplier2 = Entity::firstOrCreate(
            ['tenant_id' => $tenant->id, 'ssm_number' => 'SSM-002-DEMO'],
            [
                'name'          => 'Ayam Segar Enterprise',
                'entity_type'   => 'supplier',
                'contact_phone' => '03-7788990',
                'credit_terms'  => 'net7',
                'verified_at'   => now(),
                'verified_by'   => $admin->id,
            ]
        );

        // ── Buyers ───────────────────────────────────────────────────────────
        $buyer1 = Entity::firstOrCreate(
            ['tenant_id' => $tenant->id, 'ssm_number' => 'SSM-003-DEMO'],
            [
                'name'          => 'Pasaraya Mega Jaya Sdn Bhd',
                'entity_type'   => 'buyer',
                'contact_phone' => '03-2211000',
                'credit_terms'  => 'net14',
                'verified_at'   => now(),
                'verified_by'   => $admin->id,
            ]
        );

        // ── Quota Holder ─────────────────────────────────────────────────────
        $quotaHolder = Entity::firstOrCreate(
            ['tenant_id' => $tenant->id, 'ssm_number' => 'SSM-004-DEMO'],
            [
                'name'          => 'BERNAS Authorised Quota Holder',
                'entity_type'   => 'quota_holder',
                'contact_phone' => '03-9988776',
                'credit_terms'  => 'cod',
                'verified_at'   => now(),
                'verified_by'   => $admin->id,
            ]
        );

        // Assign roles for Quantum Actor model
        foreach ([
            [$supplier1->id, 'supplier'],
            [$supplier2->id, 'supplier'],
            [$buyer1->id,    'buyer'],
            [$quotaHolder->id, 'quota_holder'],
        ] as [$entityId, $role]) {
            EntityRole::firstOrCreate(
                ['entity_id' => $entityId, 'tenant_id' => $tenant->id, 'role' => $role],
                ['is_primary' => true, 'created_by' => $admin->id]
            );
        }

        $entityUsers = [
            [
                'entity' => $supplier1,
                'name' => 'Ladang Padi Maju User',
                'email' => 'supplier@ladang-padi-demo.com.my',
                'password' => 'Supplier@2026!',
                'role' => 'external_supplier',
            ],
            [
                'entity' => $supplier2,
                'name' => 'Ayam Segar User',
                'email' => 'supplier@ayam-segar-demo.com.my',
                'password' => 'Supplier2@2026!',
                'role' => 'external_supplier',
            ],
            [
                'entity' => $buyer1,
                'name' => 'Pasaraya Mega Jaya User',
                'email' => 'buyer@mega-jaya-demo.com.my',
                'password' => 'Buyer@2026!',
                'role' => 'external_buyer',
            ],
            [
                'entity' => $quotaHolder,
                'name' => 'BERNAS Quota Holder User',
                'email' => 'quota@bernas-demo.com.my',
                'password' => 'Quota@2026!',
                'role' => 'external_quota_holder',
            ],
        ];

        foreach ($entityUsers as $account) {
            $user = User::firstOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => Hash::make($account['password']),
                    'tenant_id' => $tenant->id,
                    'entity_id' => $account['entity']->id,
                    'locale' => 'ms',
                    'is_active' => true,
                ]
            );

            if ($user->entity_id !== $account['entity']->id) {
                $user->forceFill([
                    'tenant_id' => $tenant->id,
                    'entity_id' => $account['entity']->id,
                ])->save();
            }

            $user->syncRoles([$account['role']]);
            $this->command->line("  Entity user: {$account['email']} / {$account['password']}");
        }

        $berasProduct = Product::where('tenant_id', $tenant->id)
                               ->where('sku', 'BERAS-TEMP-S')->first();

        $ayamProduct = Product::where('tenant_id', $tenant->id)
                              ->where('sku', 'AYAM-SGR-W')->first();

        // ── Sample Inbound Order (PENDING_ACCEPTANCE) ────────────────────────
        if ($berasProduct && ! Order::where('tenant_id', $tenant->id)->where('order_number', 'like', 'MSK-%')->exists()) {
            $inboundOrder = Order::create([
                'tenant_id'           => $tenant->id,
                'order_number'        => 'MSK-2026-0322-00001',
                'type'                => 'inbound',
                'status'              => 'PENDING_ACCEPTANCE',
                'entity_id'           => $supplier1->id,
                'entity_role_snapshot' => ['supplier'],
                'total_amount'        => '2550.00',
                'deposit_rate'        => 30.00,
                'deposit_amount'      => '765.00',
                'payment_terms'       => 'cod',
                'sla_deadline_at'     => now()->addHours(20),
                'created_by'          => $admin->id,
            ]);

            OrderItem::create([
                'tenant_id'              => $tenant->id,
                'order_id'               => $inboundOrder->id,
                'product_id'             => $berasProduct->id,
                'product_snapshot_name'  => $berasProduct->name,
                'product_snapshot_sku'   => $berasProduct->sku,
                'product_snapshot_unit'  => $berasProduct->unit,
                'quantity'               => 100,
                'unit_price'             => '21.00',
                'line_total'             => '2100.00',
                'quota_fee_per_unit'     => '4.50',
                'shelf_life_days_snapshot' => 365,
            ]);

            OrderStateLog::create([
                'tenant_id'            => $tenant->id,
                'order_id'             => $inboundOrder->id,
                'from_state'           => null,
                'to_state'             => 'CREATED',
                'triggered_by_type'    => 'user',
                'triggered_by_user_id' => $admin->id,
                'triggered_by_label'   => $admin->name,
                'triggered_at'         => now()->subMinutes(10),
            ]);

            OrderStateLog::create([
                'tenant_id'            => $tenant->id,
                'order_id'             => $inboundOrder->id,
                'from_state'           => 'CREATED',
                'to_state'             => 'PENDING_ACCEPTANCE',
                'triggered_by_type'    => 'user',
                'triggered_by_user_id' => $admin->id,
                'triggered_by_label'   => $admin->name,
                'triggered_at'         => now()->subMinutes(5),
            ]);

            $this->command->line("  Demo inbound order created: {$inboundOrder->order_number}");
        }

        $this->command->info('Demo data seeded.');
    }
}
