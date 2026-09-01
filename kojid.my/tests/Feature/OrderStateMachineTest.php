<?php

use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Entity;
use App\Models\Deposit;
use App\Services\OrderStateMachineService;
use App\Services\LedgerService;
use App\Services\NotificationService;
use App\Exceptions\InvalidStateTransitionException;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─────────────────────────────────────────────────────────────────────────────
// OrderStateMachineTest
// ─────────────────────────────────────────────────────────────────────────────

describe('OrderStateMachineService', function () {

    beforeEach(function () {
        $this->tenant = Tenant::factory()->create();
        $this->user   = User::factory()->forTenant($this->tenant)->create();
        $this->entity = Entity::factory()->forTenant($this->tenant)->supplier()->create();
        $this->service = app(OrderStateMachineService::class);

        // Act as tenant user
        $this->actingAs($this->user);
    });

    it('transitions inbound order through full valid path', function () {
        $order = Order::factory()->inbound()->forTenant($this->tenant)->create([
            'entity_id'  => $this->entity->id,
            'created_by' => $this->user->id,
        ]);

        $states = [
            Order::INBOUND_PENDING_ACCEPTANCE,
            Order::INBOUND_DEPOSIT_COMMITTED,
            Order::INBOUND_PENDING_DELIVERY,
            Order::INBOUND_RECEIVED_STOCKED,
            Order::INBOUND_RISK_ACQUIRED,
        ];

        // Seed a RECEIVED deposit so DEPOSIT_COMMITTED precondition passes
        Deposit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id'  => $order->id,
            'entity_id' => $this->entity->id,
            'status'    => 'RECEIVED',
            'amount'    => '500.00',
        ]);

        // Seed an order item so RISK_ACQUIRED precondition passes
        \App\Models\OrderItem::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id'  => $order->id,
        ]);

        foreach ($states as $toState) {
            $order = $this->service->transition($order, $toState, $this->user, 'user');
            expect($order->status)->toBe($toState);
        }

        expect($order->isInTerminalState())->toBeTrue();
    });

    it('throws InvalidStateTransitionException for invalid transitions', function () {
        $order = Order::factory()->inbound()->forTenant($this->tenant)->create([
            'entity_id'  => $this->entity->id,
            'created_by' => $this->user->id,
        ]);

        // Cannot jump from CREATED to RISK_ACQUIRED
        expect(fn () => $this->service->transition($order, Order::INBOUND_RISK_ACQUIRED, $this->user))
            ->toThrow(InvalidStateTransitionException::class);
    });

    it('throws InvalidStateTransitionException on direct model status update', function () {
        $order = Order::factory()->inbound()->forTenant($this->tenant)->create([
            'entity_id'  => $this->entity->id,
            'created_by' => $this->user->id,
        ]);

        expect(fn () => $order->update(['status' => 'RISK_ACQUIRED']))
            ->toThrow(InvalidStateTransitionException::class);
    });

    it('records immutable state log on every transition', function () {
        $order = Order::factory()->inbound()->forTenant($this->tenant)->create([
            'entity_id'  => $this->entity->id,
            'status'     => Order::INBOUND_CREATED,
            'created_by' => $this->user->id,
        ]);

        $this->service->transition($order, Order::INBOUND_PENDING_ACCEPTANCE, $this->user, 'user', 'Test note');

        $log = $order->stateLogs()->latest('triggered_at')->first();

        expect($log)->not->toBeNull()
            ->and($log->from_state)->toBe(Order::INBOUND_CREATED)
            ->and($log->to_state)->toBe(Order::INBOUND_PENDING_ACCEPTANCE)
            ->and($log->notes)->toBe('Test note')
            ->and($log->triggered_by_user_id)->toBe($this->user->id);
    });

    it('cannot transition a terminal order', function () {
        $order = Order::factory()->inbound()->forTenant($this->tenant)->create([
            'entity_id'  => $this->entity->id,
            'status'     => Order::INBOUND_CANCELLED,
            'created_by' => $this->user->id,
        ]);

        expect(fn () => $this->service->transition($order, Order::INBOUND_PENDING_ACCEPTANCE, $this->user))
            ->toThrow(InvalidStateTransitionException::class);
    });

    it('returns allowed transitions for current state', function () {
        $order = Order::factory()->inbound()->forTenant($this->tenant)->create([
            'entity_id'  => $this->entity->id,
            'status'     => Order::INBOUND_CREATED,
            'created_by' => $this->user->id,
        ]);

        $allowed = $this->service->getAllowedTransitions($order);

        expect($allowed)->toContain(Order::INBOUND_PENDING_ACCEPTANCE)
            ->and($allowed)->toContain(Order::INBOUND_CANCELLED)
            ->and($allowed)->not->toContain(Order::INBOUND_RISK_ACQUIRED);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GuillotinaTest
// ─────────────────────────────────────────────────────────────────────────────

describe('GuillotinaService', function () {

    uses(RefreshDatabase::class);

    beforeEach(function () {
        $this->tenant  = Tenant::factory()->create();
        $this->user    = User::factory()->forTenant($this->tenant)->create();
        $this->entity  = Entity::factory()->forTenant($this->tenant)->buyer()->create();
        $this->actingAs($this->user);
    });

    it('cancels and forfeits deposit on SLA-breached order', function () {
        $order = Order::factory()->outbound()->forTenant($this->tenant)->create([
            'entity_id'       => $this->entity->id,
            'status'          => Order::OUTBOUND_PENDING_BUYER_DEPOSIT,
            'sla_deadline_at' => now()->subHours(2), // Past SLA
            'total_amount'    => '1000.00',
            'created_by'      => $this->user->id,
        ]);

        $deposit = Deposit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id'  => $order->id,
            'entity_id' => $this->entity->id,
            'status'    => 'RECEIVED',
            'amount'    => '300.00',
        ]);

        $guillotina = app(\App\Services\GuillotinaService::class);
        $guillotina->execute($order);

        $order->refresh();
        $deposit->refresh();

        expect($order->status)->toBe(Order::OUTBOUND_CANCELLED_FORFEITED)
            ->and($order->guillotina_triggered_at)->not->toBeNull()
            ->and($deposit->status)->toBe('FORFEITED')
            ->and($deposit->forfeited_at)->not->toBeNull();
    });

    it('posts correct ledger entries on forfeiture', function () {
        $order = Order::factory()->outbound()->forTenant($this->tenant)->create([
            'entity_id'       => $this->entity->id,
            'status'          => Order::OUTBOUND_PENDING_BUYER_DEPOSIT,
            'sla_deadline_at' => now()->subHour(),
            'total_amount'    => '2000.00',
            'created_by'      => $this->user->id,
        ]);

        Deposit::factory()->create([
            'tenant_id' => $this->tenant->id,
            'order_id'  => $order->id,
            'entity_id' => $this->entity->id,
            'status'    => 'RECEIVED',
            'amount'    => '600.00',
        ]);

        app(\App\Services\GuillotinaService::class)->execute($order);

        // DR 2100 (Deposit Liability) / CR 4100 (Penalty Income)
        $dr = \App\Models\LedgerEntry::where('order_id', $order->id)
            ->where('account_code', '2100')
            ->first();
        $cr = \App\Models\LedgerEntry::where('order_id', $order->id)
            ->where('account_code', '4100')
            ->first();

        expect($dr)->not->toBeNull()
            ->and((float) $dr->dr_amount)->toBe(600.0)
            ->and($cr)->not->toBeNull()
            ->and((float) $cr->cr_amount)->toBe(600.0);
    });

    it('does not double-fire on already triggered order', function () {
        $order = Order::factory()->outbound()->forTenant($this->tenant)->create([
            'entity_id'               => $this->entity->id,
            'status'                  => Order::OUTBOUND_PENDING_BUYER_DEPOSIT,
            'sla_deadline_at'         => now()->subHours(2),
            'guillotina_triggered_at' => now()->subMinute(), // Already fired
            'created_by'              => $this->user->id,
        ]);

        expect($order->isGuillotinaCandidate())->toBeFalse();
    });
});
