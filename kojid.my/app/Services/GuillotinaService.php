<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Deposit;
use App\Events\GuillotinaTriggered;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * GuillotinaService
 *
 * Executes the Guillotina (Ghost Order Killer) on SLA-breached orders.
 *
 * When triggered, it:
 *   1. Transitions the order to CANCELLED_FORFEITED
 *   2. Forfeits any held deposit
 *   3. Writes penalty income ledger entries
 *   4. Fires GuillotinaTriggered event (notifications sent via listener)
 *   5. Logs to audit trail
 *
 * Called by: ProcessGuillotinaTimers artisan command (every minute via scheduler).
 */
class GuillotinaService
{
    public function __construct(
        private readonly OrderStateMachineService $stateMachine,
        private readonly LedgerService $ledgerService,
        private readonly NotificationService $notificationService,
    ) {}

    /**
     * Execute the Guillotina on a single order.
     * Everything runs in a single DB transaction for atomicity.
     *
     * @param  Order $order  Must be a Guillotina candidate (past SLA, non-terminal, unfired)
     */
    public function execute(Order $order): void
    {
        if (! $order->isGuillotinaCandidate()) {
            Log::warning('GuillotinaService: called on non-candidate order', [
                'order_id' => $order->id,
                'status'   => $order->status,
                'sla_at'   => $order->sla_deadline_at,
            ]);
            return;
        }

        Log::info('KOJID:Guillotina:Executing', [
            'order_id'  => $order->id,
            'order_num' => $order->order_number,
            'status'    => $order->status,
            'sla_at'    => $order->sla_deadline_at,
            'tenant'    => $order->tenant_id,
        ]);

        DB::transaction(function () use ($order) {
            // 1. Mark the guillotina timestamp to prevent double-execution
            $order->allowStateTransition();
            $order->update([
                'guillotina_triggered_at' => now(),
            ]);

            // 2. Transition order state to CANCELLED_FORFEITED via state machine
            $this->stateMachine->transition(
                order:     $order,
                toState:   Order::INBOUND_CANCELLED_FORFEITED, // same constant for outbound
                actor:     null,
                actorType: 'guillotina',
                notes:     "Guillotina executed: SLA breached at {$order->sla_deadline_at->toDateTimeString()} MYT",
                metadata:  [
                    'sla_deadline_at'    => $order->sla_deadline_at->toIso8601String(),
                    'breach_seconds'     => now()->diffInSeconds($order->sla_deadline_at),
                    'original_status'    => $order->status,
                ],
            );

            // 3. Forfeit any deposit in RECEIVED or PENDING status
            $this->forfeitDeposit($order);
        });

        // 4. Fire event outside transaction (notifications, cleanup)
        event(new GuillotinaTriggered($order));

        Log::info('KOJID:Guillotina:Complete', ['order_id' => $order->id]);
    }

    /**
     * Forfeit the deposit associated with this order.
     * Posts DR Deposit Liability / CR Penalty Income to the ledger.
     */
    private function forfeitDeposit(Order $order): void
    {
        /** @var Deposit|null $deposit */
        $deposit = $order->deposits()
                         ->whereIn('status', [Deposit::STATUS_RECEIVED, Deposit::STATUS_PENDING])
                         ->latest()
                         ->first();

        if (! $deposit) {
            Log::info('GuillotinaService: no deposit to forfeit', ['order_id' => $order->id]);
            return;
        }

        // Update deposit status to FORFEITED
        $deposit->update([
            'status'           => Deposit::STATUS_FORFEITED,
            'forfeited_at'     => now(),
            'forfeiture_reason' => 'Automatic forfeiture: Guillotina triggered due to SLA breach.',
        ]);

        // Double-entry: remove deposit liability, recognise penalty income
        $this->ledgerService->post(
            entries: [
                [
                    'account' => '2100', // Deposit Liability — DR (obligation discharged)
                    'dr'      => $deposit->amount,
                    'cr'      => '0.00',
                ],
                [
                    'account' => '4100', // Penalty Income — CR (income recognised)
                    'dr'      => '0.00',
                    'cr'      => $deposit->amount,
                ],
            ],
            reference:   'GUIL-' . $order->order_number,
            narrative:   "Deposit forfeited — Guillotina executed on {$order->order_number}",
            initiatedBy: $order->created_by ?? 1, // Order creator / system actor
            orderId:     $order->id,
            depositId:   $deposit->id,
            tenantId:    $order->tenant_id,
        );
    }

    /**
     * Send SLA warning notifications to relevant parties.
     * Called by SendSlaWarnings command at 4h and 1h before Guillotina.
     *
     * @param  Order $order
     * @param  int   $hoursRemaining  4 or 1
     */
    public function sendWarning(Order $order, int $hoursRemaining): void
    {
        $this->notificationService->sendGuillotinaWarning($order, $hoursRemaining);

        Log::info('KOJID:Guillotina:WarningSent', [
            'order_id' => $order->id,
            'hours'    => $hoursRemaining,
        ]);
    }
}
