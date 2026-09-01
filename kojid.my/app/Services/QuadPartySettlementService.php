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
 * QuadPartySettlementService
 *
 * Handles 4-party settlement for quota-regulated commodities (beras, gula, etc.).
 *
 * Four-party settlement formula:
 *   Buyer pays:        Total Sale Price (RM)
 *   Tenant disburses:
 *     → Real Supplier:       Physical goods cost (negotiated)
 *     → Virtual Supplier:    Quota fee (fixed or % of sale)
 *       (Quota Holder)
 *     → Logistics:           Actual transport cost
 *   Tenant retains:    Sale Price − Goods − Quota Fee − Logistics = Gross Margin
 *
 * All four disbursements are individual ledger entries.
 * Dispute recalculation is handled by RecalculateQuadPartySettlement job.
 */
class QuadPartySettlementService
{
    public function __construct(
        private readonly LedgerService $ledgerService,
    ) {}

    /**
     * Perform 4-party settlement for a quota-gated order.
     *
     * @param  Order $order     The outbound order (must have quota_holder_entity_id set)
     * @param  int   $settledBy User ID
     * @param  array $overrides Optional overrides: ['quota_fee' => '500.00', 'logistics_cost' => '200.00']
     */
    public function settle(Order $order, int $settledBy, array $overrides = []): Settlement
    {
        $currency = Currency::of('MYR');

        // --- Compute the four financial legs ---

        // Leg A: Total sale price (what buyer pays)
        $saleAmount = Money::of((string) $order->total_amount, $currency);

        // Leg B: Goods cost (what tenant pays real supplier)
        $goodsCost = $this->sumLineItemCost($order, $currency);

        // Leg C: Quota fee (what tenant pays virtual supplier / quota holder)
        $quotaFee = Money::of((string) ($overrides['quota_fee'] ?? $this->calculateQuotaFee($order)), $currency);

        // Leg D: Logistics cost (optional transport disbursement)
        $logisticsCost = Money::of((string) ($overrides['logistics_cost'] ?? $this->sumLogisticsCost($order)), $currency);

        // Tenant gross margin = sale − goods − quota − logistics
        $grossMargin = $saleAmount
            ->minus($goodsCost)
            ->minus($quotaFee)
            ->minus($logisticsCost);

        $marginPct = $saleAmount->isPositive()
            ? round(
                (float) $grossMargin->getAmount()->__toString() /
                (float) $saleAmount->getAmount()->__toString() * 100,
                2
            )
            : 0.0;

        return DB::transaction(function () use (
            $order, $settledBy, $saleAmount, $goodsCost, $quotaFee,
            $logisticsCost, $grossMargin, $marginPct, $currency
        ) {
            $ref = 'SET4P-' . strtoupper(Str::random(8));

            // Create settlement record
            $settlement = Settlement::create([
                'tenant_id'         => $order->tenant_id,
                'order_id'          => $order->id,
                'reference'         => $ref,
                'type'              => '4_party',
                'status'            => 'processing',
                'gross_sale_amount' => $saleAmount->getAmount()->__toString(),
                'goods_cost'        => $goodsCost->getAmount()->__toString(),
                'quota_fee'         => $quotaFee->getAmount()->__toString(),
                'logistics_cost'    => $logisticsCost->getAmount()->__toString(),
                'gross_margin'      => $grossMargin->getAmount()->__toString(),
                'margin_percent'    => $marginPct,
                'created_by'        => $settledBy,
            ]);

            // Create four breakdown records (one per party)
            $this->createBreakdown($settlement, $order, 'buyer',
                $order->entity_id, "Buyer payment: {$order->order_number}",
                $saleAmount, 'inflow');

            $this->createBreakdown($settlement, $order, 'real_supplier',
                $order->entity_id, "Goods payment to supplier",
                $goodsCost, 'outflow');

            if ($quotaFee->isPositive() && $order->quota_holder_entity_id) {
                $this->createBreakdown($settlement, $order, 'virtual_supplier',
                    $order->quota_holder_entity_id, "Quota fee to quota holder",
                    $quotaFee, 'outflow');
            }

            if ($logisticsCost->isPositive()) {
                $this->createBreakdown($settlement, $order, 'logistics',
                    $order->entity_id, "Logistics disbursement",
                    $logisticsCost, 'outflow');
            }

            $this->createBreakdown($settlement, $order, 'tenant',
                $order->entity_id, "Tenant gross margin retained",
                $grossMargin, 'inflow');

            // --- Post ledger entries (one per disbursement for full traceability) ---

            // 1. Buyer payment received: DR AR (1100) / CR Revenue (4000)
            $this->ledgerService->post([
                ['account' => '1100', 'dr' => $saleAmount->getAmount()->__toString(), 'cr' => '0.00'],
                ['account' => '4000', 'dr' => '0.00', 'cr' => $saleAmount->getAmount()->__toString()],
            ], "{$ref}-SALE", "4-party sale revenue: {$order->order_number}", $settledBy,
               $order->id, null, $settlement->id, $order->tenant_id);

            // 2. Goods cost: DR COGS (5000) / CR AP (2000)
            $this->ledgerService->post([
                ['account' => '5000', 'dr' => $goodsCost->getAmount()->__toString(), 'cr' => '0.00'],
                ['account' => '2000', 'dr' => '0.00', 'cr' => $goodsCost->getAmount()->__toString()],
            ], "{$ref}-GOODS", "Goods payable to real supplier: {$order->order_number}", $settledBy,
               $order->id, null, $settlement->id, $order->tenant_id);

            // 3. Quota fee: DR Quota Fee Expense (5200) / CR AP (2000)
            if ($quotaFee->isPositive()) {
                $this->ledgerService->post([
                    ['account' => '5200', 'dr' => $quotaFee->getAmount()->__toString(), 'cr' => '0.00'],
                    ['account' => '2000', 'dr' => '0.00', 'cr' => $quotaFee->getAmount()->__toString()],
                ], "{$ref}-QUOTA", "Quota fee payable to quota holder: {$order->order_number}", $settledBy,
                   $order->id, null, $settlement->id, $order->tenant_id);
            }

            // 4. Logistics: DR Logistics Cost (5100) / CR AP (2000)
            if ($logisticsCost->isPositive()) {
                $this->ledgerService->post([
                    ['account' => '5100', 'dr' => $logisticsCost->getAmount()->__toString(), 'cr' => '0.00'],
                    ['account' => '2000', 'dr' => '0.00', 'cr' => $logisticsCost->getAmount()->__toString()],
                ], "{$ref}-LOGI", "Logistics cost: {$order->order_number}", $settledBy,
                   $order->id, null, $settlement->id, $order->tenant_id);
            }

            $settlement->update(['status' => 'completed', 'completed_at' => now()]);

            return $settlement;
        });
    }

    /**
     * Recalculate a disputed 4-party settlement with revised amounts.
     * Called by RecalculateQuadPartySettlement job.
     *
     * @param  Settlement $settlement  The settlement to recalculate
     * @param  array      $newAmounts  ['goods_cost' => '...', 'quota_fee' => '...', 'logistics_cost' => '...']
     * @param  int        $adjustedBy  User ID
     */
    public function recalculate(Settlement $settlement, array $newAmounts, int $adjustedBy): Settlement
    {
        $order = $settlement->order;

        // Reverse the original settlement entries
        foreach (['SALE', 'GOODS', 'QUOTA', 'LOGI'] as $suffix) {
            try {
                $this->ledgerService->reverse(
                    "{$settlement->reference}-{$suffix}",
                    "Recalculation on settlement {$settlement->reference}",
                    $adjustedBy,
                );
            } catch (\InvalidArgumentException) {
                // Entry may not exist (e.g., no quota fee) — skip gracefully
            }
        }

        // Re-run settlement with new amounts
        return $this->settle($order, $adjustedBy, $newAmounts);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function sumLineItemCost(Order $order, Currency $currency): Money
    {
        $total = '0.00';
        foreach ($order->items as $item) {
            $total = bcadd($total, (string) $item->line_total, 2);
        }
        return Money::of($total, $currency);
    }

    private function sumLogisticsCost(Order $order): string
    {
        $total = '0.00';
        foreach ($order->items as $item) {
            $total = bcadd($total, (string) $item->logistics_cost, 2);
        }
        return $total;
    }

    private function calculateQuotaFee(Order $order): string
    {
        $total = '0.00';
        foreach ($order->items as $item) {
            $fee   = bcmul((string) $item->quota_fee_per_unit, (string) $item->quantity, 2);
            $total = bcadd($total, $fee, 2);
        }
        return $total;
    }

    private function createBreakdown(
        Settlement $settlement,
        Order $order,
        string $partyRole,
        int $entityId,
        string $description,
        Money $amount,
        string $direction,
    ): void {
        SettlementBreakdown::create([
            'tenant_id'     => $order->tenant_id,
            'settlement_id' => $settlement->id,
            'entity_id'     => $entityId,
            'party_role'    => $partyRole,
            'description'   => $description,
            'amount'        => $amount->getAmount()->__toString(),
            'direction'     => $direction,
            'status'        => 'pending',
        ]);
    }
}
