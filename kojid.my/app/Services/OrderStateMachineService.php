<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderStateLog;
use App\Models\User;
use App\Models\Deposit;
use App\Events\OrderStateTransitioned;
use App\Exceptions\InvalidStateTransitionException;
use App\Exceptions\PreconditionFailedException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * OrderStateMachineService
 *
 * THE ONLY class permitted to mutate orders.status.
 * Enforces the complete Two-Leg state machine graph.
 * Every transition is validated, logged, and fires events atomically.
 *
 * Inbound graph:
 *   CREATED → PENDING_ACCEPTANCE → DEPOSIT_COMMITTED → PENDING_DELIVERY
 *     → RECEIVED_STOCKED → RISK_ACQUIRED
 *     → CANCELLED_FORFEITED (guillotina)
 *     → CANCELLED (pre-commit)
 *
 * Outbound graph:
 *   CREATED → PENDING_BUYER_DEPOSIT → DEPOSIT_CONFIRMED → PENDING_DISPATCH
 *     → IN_TRANSIT → DELIVERED → SETTLED
 *     → DISPUTED → SETTLED | ADJUSTED
 *     → CANCELLED_FORFEITED (guillotina)
 */
class OrderStateMachineService
{
    /**
     * Valid state graph per order type.
     * Maps from_state → array of allowed to_states.
     *
     * @var array<string, array<string, string[]>>
     */
    private const GRAPH = [
        'inbound' => [
            'CREATED'             => ['PENDING_ACCEPTANCE', 'CANCELLED'],
            'PENDING_ACCEPTANCE'  => ['DEPOSIT_COMMITTED', 'CANCELLED'],
            'DEPOSIT_COMMITTED'   => ['PENDING_DELIVERY', 'CANCELLED_FORFEITED'],
            'PENDING_DELIVERY'    => ['RECEIVED_STOCKED', 'CANCELLED_FORFEITED'],
            'RECEIVED_STOCKED'    => ['RISK_ACQUIRED'],
            'RISK_ACQUIRED'       => [],   // terminal
            'CANCELLED'           => [],   // terminal
            'CANCELLED_FORFEITED' => [],   // terminal
        ],
        'outbound' => [
            'CREATED'               => ['PENDING_BUYER_DEPOSIT', 'CANCELLED_FORFEITED'],
            'PENDING_BUYER_DEPOSIT' => ['DEPOSIT_CONFIRMED', 'CANCELLED_FORFEITED'],
            'DEPOSIT_CONFIRMED'     => ['PENDING_DISPATCH'],
            'PENDING_DISPATCH'      => ['IN_TRANSIT'],
            'IN_TRANSIT'            => ['DELIVERED'],
            'DELIVERED'             => ['SETTLED', 'DISPUTED'],
            'DISPUTED'              => ['SETTLED', 'ADJUSTED'],
            'SETTLED'               => [],  // terminal
            'ADJUSTED'              => [],  // terminal
            'CANCELLED_FORFEITED'   => [],  // terminal
        ],
    ];

    /**
     * Preconditions that must be met before entering a target state.
     * Each key is the target state; value is a method name on this class.
     *
     * @var array<string, string>
     */
    private const PRECONDITIONS = [
        'DEPOSIT_COMMITTED'  => 'requireDepositReceived',
        'DEPOSIT_CONFIRMED'  => 'requireDepositReceived',
        'RISK_ACQUIRED'      => 'requireAllItemsStocked',
        'SETTLED'            => 'requireSettlementExists',
    ];

    public function __construct(
        private readonly LedgerService $ledgerService,
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * Transition an order to a new state.
     *
     * This is the ONLY public entry point for changing order status.
     * Wraps everything in a DB transaction so the transition is atomic.
     *
     * @param  Order       $order      The order to transition
     * @param  string      $toState    Target state constant
     * @param  User|null   $actor      The user triggering (null = system/scheduler)
     * @param  string      $actorType  'user' | 'system' | 'guillotina' | 'scheduler'
     * @param  string|null $notes      Optional notes to record on the log
     * @param  array       $metadata   Optional metadata for the log entry
     *
     * @throws InvalidStateTransitionException  if transition is not in the graph
     * @throws PreconditionFailedException      if a precondition check fails
     */
    public function transition(
        Order $order,
        string $toState,
        ?User $actor = null,
        string $actorType = 'user',
        ?string $notes = null,
        array $metadata = [],
    ): Order {
        $fromState = $order->status;

        // 1. Validate the transition is allowed by the graph
        $this->assertTransitionAllowed($order, $toState);

        // 2. Run precondition checks
        $this->runPreconditions($order, $toState);

        // 3. Execute atomically inside a DB transaction
        DB::transaction(function () use ($order, $fromState, $toState, $actor, $actorType, $notes, $metadata) {

            // 4. Calculate new SLA deadline for this state (if applicable)
            $slaDeadline = $this->calculateSlaDeadline($order, $toState);

            // 5. Allow the model's boot guard to accept this update
            $order->allowStateTransition();

            // 6. Persist the status change
            $order->update([
                'status'       => $toState,
                'sla_deadline_at' => $slaDeadline ?? $order->sla_deadline_at,
                'settled_at'   => $toState === 'SETTLED' ? now() : $order->settled_at,
                'last_updated_by' => $actor?->id,
                'version'      => $order->version + 1,
            ]);

            // 7. Write immutable state log entry (same transaction)
            OrderStateLog::create([
                'tenant_id'             => $order->tenant_id,
                'order_id'              => $order->id,
                'from_state'            => $fromState,
                'to_state'              => $toState,
                'triggered_by_type'     => $actorType,
                'triggered_by_user_id'  => $actor?->id,
                'triggered_by_label'    => $actor?->name ?? ucfirst($actorType),
                'notes'                 => $notes,
                'metadata'              => $metadata,
                'triggered_at'          => now(),
            ]);

        });

        // 8. Reload fresh model post-transaction
        $order->refresh();

        // 9. Fire event (listeners handle: ledger entries, notifications, SLA Redis timers)
        event(new OrderStateTransitioned($order, $fromState, $toState, $actor));

        Log::info('KOJID:OrderStateTransition', [
            'order_id'   => $order->id,
            'order_num'  => $order->order_number,
            'from'       => $fromState,
            'to'         => $toState,
            'actor'      => $actor?->id ?? $actorType,
            'tenant'     => $order->tenant_id,
        ]);

        return $order;
    }

    // -------------------------------------------------------------------------
    // Graph validation
    // -------------------------------------------------------------------------

    /**
     * Assert that the transition from current state → toState is in the graph.
     *
     * @throws InvalidStateTransitionException
     */
    private function assertTransitionAllowed(Order $order, string $toState): void
    {
        $type      = $order->type;
        $fromState = $order->status;
        $graph     = self::GRAPH[$type] ?? [];
        $allowed   = $graph[$fromState] ?? [];

        if (! in_array($toState, $allowed, true)) {
            throw new InvalidStateTransitionException(
                message:   "Transition {$fromState} → {$toState} is not permitted for {$type} orders.",
                fromState: $fromState,
                toState:   $toState,
                orderId:   $order->id,
            );
        }
    }

    /**
     * Get all valid next states for an order's current status.
     *
     * @return string[]
     */
    public function getAllowedTransitions(Order $order): array
    {
        return self::GRAPH[$order->type][$order->status] ?? [];
    }

    // -------------------------------------------------------------------------
    // Preconditions
    // -------------------------------------------------------------------------

    /**
     * Run any registered precondition check for the target state.
     *
     * @throws PreconditionFailedException
     */
    private function runPreconditions(Order $order, string $toState): void
    {
        if (isset(self::PRECONDITIONS[$toState])) {
            $method = self::PRECONDITIONS[$toState];
            $this->$method($order);
        }
    }

    /**
     * Precondition: a deposit record must exist in RECEIVED status.
     *
     * @throws PreconditionFailedException
     */
    private function requireDepositReceived(Order $order): void
    {
        $hasReceived = $order->deposits()
                             ->where('status', Deposit::STATUS_RECEIVED)
                             ->exists();

        if (! $hasReceived) {
            throw new PreconditionFailedException(
                'deposit_received',
                'Cannot advance order — no confirmed deposit on record. ' .
                'Deposit must be in RECEIVED status before this transition.'
            );
        }
    }

    /**
     * Precondition: all order items must be marked as stocked.
     *
     * @throws PreconditionFailedException
     */
    private function requireAllItemsStocked(Order $order): void
    {
        // Stocked state is confirmed by reaching RECEIVED_STOCKED — no separate flag needed.
        // This guard ensures the order has at least one item.
        if ($order->items()->count() === 0) {
            throw new PreconditionFailedException(
                'order_has_items',
                'Cannot acquire risk on an order with no line items.'
            );
        }
    }

    /**
     * Precondition: a settlement record must exist before marking SETTLED.
     *
     * @throws PreconditionFailedException
     */
    private function requireSettlementExists(Order $order): void
    {
        if (! $order->settlement()->exists()) {
            throw new PreconditionFailedException(
                'settlement_exists',
                'Cannot mark order as SETTLED without a settlement record. ' .
                'Run PaymentSettlementService::settle() first.'
            );
        }
    }

    // -------------------------------------------------------------------------
    // SLA deadline calculation
    // -------------------------------------------------------------------------

    /**
     * Calculate the SLA deadline timestamp for the given target state.
     * Returns null if no SLA applies to this state.
     */
    private function calculateSlaDeadline(Order $order, string $toState): ?\Carbon\Carbon
    {
        $tenant    = $order->tenant;
        $stateKey  = strtolower($toState);

        $hours = $tenant->getSlaHours($order->type, $stateKey);

        if ($hours <= 0) {
            return null;
        }

        return now()->addHours($hours);
    }
}
