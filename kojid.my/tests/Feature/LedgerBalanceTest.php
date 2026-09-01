<?php

use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Entity;
use App\Models\Deposit;
use App\Models\LedgerEntry;
use App\Services\LedgerService;
use App\Services\DepositService;
use App\Exceptions\LedgerImbalanceException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─────────────────────────────────────────────────────────────────────────────
// LedgerBalanceTest
// ─────────────────────────────────────────────────────────────────────────────

describe('LedgerService', function () {

    beforeEach(function () {
        $this->tenant  = Tenant::factory()->create();
        $this->user    = User::factory()->forTenant($this->tenant)->create();
        $this->service = app(LedgerService::class);
        $this->actingAs($this->user);
    });

    it('posts balanced entries successfully', function () {
        $this->service->post(
            entries: [
                ['account' => '1000', 'dr' => '5000.00', 'cr' => '0.00'],
                ['account' => '2100', 'dr' => '0.00',    'cr' => '5000.00'],
            ],
            reference:   'TEST-001',
            narrative:   'Test deposit',
            initiatedBy: $this->user->id,
            tenantId:    $this->tenant->id,
        );

        expect(LedgerEntry::where('transaction_ref', 'TEST-001')->count())->toBe(2);
    });

    it('throws LedgerImbalanceException when debits do not equal credits', function () {
        expect(fn () => $this->service->post(
            entries: [
                ['account' => '1000', 'dr' => '5000.00', 'cr' => '0.00'],
                ['account' => '2100', 'dr' => '0.00',    'cr' => '4999.00'], // Imbalanced
            ],
            reference:   'IMBAL-001',
            narrative:   'Imbalanced test',
            initiatedBy: $this->user->id,
            tenantId:    $this->tenant->id,
        ))->toThrow(LedgerImbalanceException::class);
    });

    it('maintains SUM(DR) = SUM(CR) across multiple postings', function () {
        $postings = [
            [['account' => '1000', 'dr' => '10000.00', 'cr' => '0.00'],
             ['account' => '2100', 'dr' => '0.00',     'cr' => '10000.00']],
            [['account' => '1200', 'dr' => '8000.00',  'cr' => '0.00'],
             ['account' => '2000', 'dr' => '0.00',     'cr' => '8000.00']],
            [['account' => '2100', 'dr' => '10000.00', 'cr' => '0.00'],
             ['account' => '4100', 'dr' => '0.00',     'cr' => '10000.00']],
        ];

        foreach ($postings as $i => $entries) {
            $this->service->post($entries, "TXN-{$i}", "Test {$i}", $this->user->id, tenantId: $this->tenant->id);
        }

        $totals = LedgerEntry::where('tenant_id', $this->tenant->id)
            ->selectRaw('SUM(dr_amount) as total_dr, SUM(cr_amount) as total_cr')
            ->first();

        expect((string) $totals->total_dr)->toBe((string) $totals->total_cr);
    });

    it('prevents updating ledger entries', function () {
        $this->service->post(
            entries: [['account' => '1000', 'dr' => '100.00', 'cr' => '0.00'],
                      ['account' => '2100', 'dr' => '0.00',   'cr' => '100.00']],
            reference: 'IMMUT-001', narrative: 'Test', initiatedBy: $this->user->id,
            tenantId: $this->tenant->id,
        );

        $entry = LedgerEntry::where('transaction_ref', 'IMMUT-001')->first();

        expect(fn () => $entry->update(['dr_amount' => '999.00']))
            ->toThrow(\RuntimeException::class);
    });

    it('generates correct trial balance', function () {
        $this->service->post(
            entries: [['account' => '1000', 'dr' => '5000.00', 'cr' => '0.00'],
                      ['account' => '4000', 'dr' => '0.00',    'cr' => '5000.00']],
            reference: 'TB-001', narrative: 'Revenue', initiatedBy: $this->user->id,
            tenantId: $this->tenant->id,
        );

        $tb = $this->service->getTrialBalance($this->tenant->id);

        $grandDr = array_sum(array_column($tb, 'total_dr'));
        $grandCr = array_sum(array_column($tb, 'total_cr'));

        expect($grandDr)->toBe($grandCr);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// MultiTenancyIsolationTest
// ─────────────────────────────────────────────────────────────────────────────

describe('Multi-Tenancy Isolation', function () {

    it('tenant A cannot see tenant B orders via web', function () {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA   = User::factory()->forTenant($tenantA)->create();
        $userA->assignRole('tenant_admin');

        $entityB = Entity::factory()->forTenant($tenantB)->create();

        $orderB = Order::factory()->inbound()->forTenant($tenantB)->create([
            'entity_id'  => $entityB->id,
            'created_by' => User::factory()->forTenant($tenantB)->create()->id,
        ]);

        // Authenticate as Tenant A user
        $this->actingAs($userA);

        // Try to access Tenant B's order directly
        $response = $this->get("/orders/inbound/{$orderB->id}");

        // Should get 404 or 403 — not 200
        expect(in_array($response->status(), [403, 404]))->toBeTrue();
    });

    it('global scope filters orders to current tenant', function () {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $userA   = User::factory()->forTenant($tenantA)->create();
        $entityA = Entity::factory()->forTenant($tenantA)->create();
        $entityB = Entity::factory()->forTenant($tenantB)->create();

        Order::factory()->inbound()->forTenant($tenantA)->count(3)->create([
            'entity_id' => $entityA->id, 'created_by' => $userA->id,
        ]);
        Order::factory()->inbound()->forTenant($tenantB)->count(5)->create([
            'entity_id' => $entityB->id,
            'created_by' => User::factory()->forTenant($tenantB)->create()->id,
        ]);

        $this->actingAs($userA);

        // With global scope active, only Tenant A orders visible
        $count = Order::inbound()->count();
        expect($count)->toBe(3);
    });

    it('super admin can see all tenants with withoutTenantScope', function () {
        $tenantA = Tenant::factory()->create();
        $tenantB = Tenant::factory()->create();

        $superAdmin = User::factory()->superAdmin()->create();
        $superAdmin->assignRole('super_admin');

        Entity::factory()->forTenant($tenantA)->create();
        Entity::factory()->forTenant($tenantB)->create();

        Order::factory()->forTenant($tenantA)->create([
            'entity_id' => Entity::factory()->forTenant($tenantA)->create()->id,
            'created_by' => $superAdmin->id,
        ]);

        $allOrders = Order::withoutTenantScope()->count();
        expect($allOrders)->toBeGreaterThanOrEqual(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// DepositWorkflowTest
// ─────────────────────────────────────────────────────────────────────────────

describe('DepositService', function () {

    beforeEach(function () {
        $this->tenant  = Tenant::factory()->create();
        $this->user    = User::factory()->forTenant($this->tenant)->create();
        $this->user->assignRole('tenant_admin');
        $this->finance = User::factory()->forTenant($this->tenant)->create();
        $this->finance->assignRole('finance_officer');
        $this->entity  = Entity::factory()->forTenant($this->tenant)->buyer()->create();
        $this->service = app(DepositService::class);
        $this->actingAs($this->user);
    });

    it('creates deposit at correct rate', function () {
        $order = Order::factory()->outbound()->forTenant($this->tenant)->create([
            'entity_id'    => $this->entity->id,
            'total_amount' => '10000.00',
            'deposit_rate' => 30.00,
            'created_by'   => $this->user->id,
        ]);

        $deposit = $this->service->create($order);

        expect($deposit->status)->toBe('PENDING')
            ->and((float) $deposit->amount)->toBe(3000.0)
            ->and((float) $deposit->rate)->toBe(30.0);
    });

    it('marks deposit received and posts ledger entry', function () {
        $order = Order::factory()->outbound()->forTenant($this->tenant)->create([
            'entity_id' => $this->entity->id, 'created_by' => $this->user->id,
        ]);
        $deposit = $this->service->create($order);

        $this->service->markReceived($deposit, 'FPX-REF-12345', $this->user->id);

        $deposit->refresh();
        expect($deposit->status)->toBe('RECEIVED')
            ->and($deposit->reference)->toBe('FPX-REF-12345');

        // Ledger: DR 1000 / CR 2100
        $dr = LedgerEntry::where('deposit_id', $deposit->id)->where('account_code', '1000')->first();
        $cr = LedgerEntry::where('deposit_id', $deposit->id)->where('account_code', '2100')->first();
        expect($dr)->not->toBeNull()->and($cr)->not->toBeNull();
    });

    it('requires dual approval before processing refund', function () {
        $order = Order::factory()->outbound()->forTenant($this->tenant)->create([
            'entity_id' => $this->entity->id, 'created_by' => $this->user->id,
        ]);
        $deposit = $this->service->create($order);
        $this->service->markReceived($deposit, 'REF-XYZ', $this->user->id);

        $this->service->requestRefund($deposit, $this->user, 'Customer cancelled order');
        $this->service->approveRefund($deposit, $this->user);

        // Should not yet be refunded — finance approval still needed
        expect($deposit->hasFullRefundApproval())->toBeFalse();

        $this->service->financeApproveRefund($deposit, $this->finance);
        expect($deposit->hasFullRefundApproval())->toBeTrue();

        $this->service->processRefund($deposit, $this->user->id);
        $deposit->refresh();
        expect($deposit->status)->toBe('REFUNDED');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// QuadPartySettlementTest
// ─────────────────────────────────────────────────────────────────────────────

describe('QuadPartySettlementService', function () {

    beforeEach(function () {
        $this->tenant      = Tenant::factory()->create();
        $this->user        = User::factory()->forTenant($this->tenant)->create();
        $this->buyer       = Entity::factory()->forTenant($this->tenant)->buyer()->create();
        $this->supplier    = Entity::factory()->forTenant($this->tenant)->supplier()->create();
        $this->quotaHolder = Entity::factory()->forTenant($this->tenant)->quotaHolder()->create();
        $this->actingAs($this->user);
    });

    it('posts four ledger entries for a quota-gated order', function () {
        $order = Order::factory()->outbound()->forTenant($this->tenant)->create([
            'entity_id'              => $this->buyer->id,
            'quota_holder_entity_id' => $this->quotaHolder->id,
            'settlement_type'        => '4_party',
            'total_amount'           => '10000.00',
            'status'                 => Order::OUTBOUND_DELIVERED,
            'created_by'             => $this->user->id,
        ]);

        $service = app(\App\Services\QuadPartySettlementService::class);
        $settlement = $service->settle($order, $this->user->id, [
            'quota_fee'      => '500.00',
            'logistics_cost' => '200.00',
        ]);

        // Should have 4 ledger transaction groups (SALE, GOODS, QUOTA, LOGI)
        $refs = LedgerEntry::where('settlement_id', $settlement->id)
            ->pluck('transaction_ref')
            ->unique()
            ->values();

        expect($refs)->toHaveCount(4);

        // Trial balance for this settlement must be zero net
        $totals = LedgerEntry::where('settlement_id', $settlement->id)
            ->selectRaw('SUM(dr_amount) as dr, SUM(cr_amount) as cr')
            ->first();

        expect($totals->dr)->toEqual($totals->cr);
    });

    it('calculates gross margin correctly', function () {
        $order = Order::factory()->outbound()->forTenant($this->tenant)->create([
            'entity_id'              => $this->buyer->id,
            'quota_holder_entity_id' => $this->quotaHolder->id,
            'settlement_type'        => '4_party',
            'total_amount'           => '10000.00',
            'status'                 => Order::OUTBOUND_DELIVERED,
            'created_by'             => $this->user->id,
        ]);

        // Add a line item for goods cost
        $order->items()->create([
            'tenant_id'             => $this->tenant->id,
            'product_id'            => \App\Models\Product::factory()->forTenant($this->tenant)->create()->id,
            'product_snapshot_name' => 'Beras Test',
            'product_snapshot_sku'  => 'TEST-SKU',
            'product_snapshot_unit' => 'karung',
            'quantity'              => 100,
            'unit_price'            => '70.00',
            'line_total'            => '7000.00',
            'quota_fee_per_unit'    => '0.00',
            'logistics_cost'        => '0.00',
        ]);

        $service = app(\App\Services\QuadPartySettlementService::class);
        $settlement = $service->settle($order, $this->user->id, [
            'quota_fee'      => '500.00',
            'logistics_cost' => '200.00',
        ]);

        // Margin = 10000 - 7000 - 500 - 200 = 2300
        expect((float) $settlement->gross_margin)->toBe(2300.0);
    });
});
