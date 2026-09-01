<?php

namespace App\Listeners;

use App\Events\OrderStateTransitioned;
use App\Models\Order;
use App\Services\LedgerService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * CreateLedgerEntryOnStateTransition
 *
 * Fires on every OrderStateTransitioned event and posts the appropriate
 * double-entry ledger entries for financially significant state changes.
 *
 * Queued on 'critical' queue — financial integrity is non-negotiable.
 */
class CreateLedgerEntryOnStateTransition implements ShouldQueue
{
    public string $queue = 'critical';
    public int    $tries = 3;

    public function __construct(private readonly LedgerService $ledgerService) {}

    public function handle(OrderStateTransitioned $event): void
    {
        $order    = $event->order;
        $toState  = $event->toState;
        $actor    = $event->actor;
        $userId   = $actor?->id ?? 1; // System user fallback

        match ($toState) {

            // Inbound: inventory received — DR Inventory at Cost / CR AP
            Order::INBOUND_RECEIVED_STOCKED => $this->postInventoryReceived($order, $userId),

            // Inbound: risk fully acquired — no new ledger entry (already posted at stocking)
            Order::INBOUND_RISK_ACQUIRED => null,

            // Both types: cancellation with forfeiture — posted by GuillotinaService directly
            // (avoid double-posting — GuillotinaService handles its own ledger entries)
            Order::INBOUND_CANCELLED_FORFEITED,
            Order::OUTBOUND_CANCELLED_FORFEITED => null,

            // Outbound: deposit liability recognised when buyer deposit confirmed
            // (DepositService::markReceived() handles this — avoid double-posting)
            Order::OUTBOUND_DEPOSIT_CONFIRMED => null,

            // Settlement posting is handled by PaymentSettlementService
            Order::OUTBOUND_SETTLED => null,

            default => null,
        };
    }

    /**
     * DR Inventory at Cost (1200) / CR Accounts Payable (2000)
     * When inbound goods are received and stocked.
     */
    private function postInventoryReceived(Order $order, int $userId): void
    {
        $goodsCost = $order->items->sum('line_total');

        if ($goodsCost <= 0) {
            return;
        }

        $this->ledgerService->post(
            entries: [
                ['account' => '1200', 'dr' => (string) $goodsCost, 'cr' => '0.00',
                 'narrative' => "Inventory received: {$order->order_number}"],
                ['account' => '2000', 'dr' => '0.00', 'cr' => (string) $goodsCost,
                 'narrative' => "Payable to supplier: {$order->order_number}"],
            ],
            reference:   'INV-' . $order->order_number,
            narrative:   "Inventory received and stocked: {$order->order_number}",
            initiatedBy: $userId,
            orderId:     $order->id,
            tenantId:    $order->tenant_id,
        );
    }
}
