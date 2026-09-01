<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Settlement;
use App\Models\SettlementBreakdown;
use Brick\Money\Money;
use Brick\Money\Currency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * PaymentSettlementService
 *
 * Classifies and orchestrates settlement for an order.
 * Delegates to QuadPartySettlementService for 4-party quota-gated transactions.
 *
 * Settlement types:
 *   2_party: tenant internal only
 *   3_party: supplier → tenant → buyer (direct chain)
 *   4_party: includes quota holder (Virtual Supplier) — e.g. beras, gula
 */
class PaymentSettlementService
{
    public function __construct(
        private readonly QuadPartySettlementService $quadParty,
        private readonly LedgerService $ledgerService,
        private readonly DepositService $depositService,
        private readonly OrderStateMachineService $stateMachine,
    ) {}

    /**
     * Classify the settlement type for an order.
     * Determination is based on quota status of line items and presence of virtual supplier.
     *
     * @return '2_party'|'3_party'|'4_party'
     */
    public function classify(Order $order): string
    {
        // Any line item with a quota-regulated product → 4-party
        $hasQuotaItem = $order->items()
                              ->whereHas('product', fn ($q) => $q->where('is_quota_regulated', true))
                              ->exists();

        if ($hasQuotaItem || $order->quota_holder_entity_id !== null) {
            return '4_party';
        }

        // Direct chain (supplier + tenant + buyer) = 3-party
        return '3_party';
    }

    /**
     * Settle an outbound order.
     * Creates the Settlement record, breakdowns, posts ledger entries, applies deposit.
     *
     * @param  Order $order       Must be in DELIVERED status
     * @param  int   $settledBy   User ID
     * @param  array $overrides   Optional override amounts (logistics_cost, quota_fee)
     */
    public function settle(Order $order, int $settledBy, array $overrides = []): Settlement
    {
        $type = $this->classify($order);

        $order->update(['settlement_type' => $type]);

        return match ($type) {
            '4_party' => $this->quadParty->settle($order, $settledBy, $overrides),
            default   => $this->settleStandardOrder($order, $settledBy, $overrides),
        };
    }

    /**
     * Settle a standard 2- or 3-party order.
     */
    private function settleStandardOrder(Order $order, int $settledBy, array $overrides): Settlement
    {
        $currency     = Currency::of('MYR');
        $saleAmount   = Money::of((string) $order->total_amount, $currency);
        $goodsCost    = $this->calculateGoodsCost($order);
        $logisticsCost = Money::of((string) ($overrides['logistics_cost'] ?? '0.00'), $currency);
        $grossMargin  = $saleAmount->minus($goodsCost)->minus($logisticsCost);
        $marginPct    = $saleAmount->isPositive()
            ? (float) $grossMargin->getAmount()->dividedBy($saleAmount->getAmount(), 4)->__toString() * 100
            : 0.0;

        return DB::transaction(function () use (
            $order, $settledBy, $saleAmount, $goodsCost, $logisticsCost, $grossMargin, $marginPct
        ) {
            $ref = 'SET-' . strtoupper(Str::random(10));

            $settlement = Settlement::create([
                'tenant_id'         => $order->tenant_id,
                'order_id'          => $order->id,
                'reference'         => $ref,
                'type'              => $order->settlement_type,
                'status'            => 'processing',
                'gross_sale_amount' => $saleAmount->getAmount()->__toString(),
                'goods_cost'        => $goodsCost->getAmount()->__toString(),
                'logistics_cost'    => $logisticsCost->getAmount()->__toString(),
                'gross_margin'      => $grossMargin->getAmount()->__toString(),
                'margin_percent'    => round($marginPct, 2),
                'created_by'        => $settledBy,
            ]);

            // Apply deposit if present
            $deposit = $order->deposits()->where('status', 'RECEIVED')->latest()->first();
            if ($deposit) {
                $this->depositService->apply($deposit, $settledBy);
            }

            // Post ledger: DR AR (1100) / CR Sales Revenue (4000)
            $this->ledgerService->post(
                entries: [
                    ['account' => '1100', 'dr' => $saleAmount->getAmount()->__toString(), 'cr' => '0.00',
                     'narrative' => "Sale: {$order->order_number}"],
                    ['account' => '4000', 'dr' => '0.00', 'cr' => $saleAmount->getAmount()->__toString(),
                     'narrative' => "Revenue: {$order->order_number}"],
                ],
                reference:   $ref . '-SALE',
                narrative:   "Sales revenue: {$order->order_number}",
                initiatedBy: $settledBy,
                orderId:     $order->id,
                settlementId: $settlement->id,
                tenantId:    $order->tenant_id,
            );

            // Post COGS
            $this->ledgerService->post(
                entries: [
                    ['account' => '5000', 'dr' => $goodsCost->getAmount()->__toString(), 'cr' => '0.00'],
                    ['account' => '1200', 'dr' => '0.00', 'cr' => $goodsCost->getAmount()->__toString()],
                ],
                reference:   $ref . '-COGS',
                narrative:   "COGS: {$order->order_number}",
                initiatedBy: $settledBy,
                orderId:     $order->id,
                settlementId: $settlement->id,
                tenantId:    $order->tenant_id,
            );

            $settlement->update(['status' => 'completed', 'completed_at' => now()]);

            // Transition order to SETTLED
            $this->stateMachine->transition(
                order:     $order,
                toState:   Order::OUTBOUND_SETTLED,
                actor:     null,
                actorType: 'system',
                notes:     "Settlement {$ref} completed.",
            );

            return $settlement;
        });
    }

    /**
     * Calculate total goods cost from order items (using bcmath — no floats).
     */
    private function calculateGoodsCost(Order $order): Money
    {
        $total = '0.00';
        foreach ($order->items as $item) {
            $total = bcadd($total, (string) $item->line_total, 2);
        }
        return Money::of($total, 'MYR');
    }
}
