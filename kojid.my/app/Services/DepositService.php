<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Deposit;
use App\Models\User;
use App\Exceptions\InsufficientDepositException;
use App\Exceptions\StaleDataException;
use Brick\Money\Money;
use Illuminate\Support\Facades\DB;

/**
 * DepositService
 *
 * Manages the full deposit lifecycle:
 *   PENDING → RECEIVED → APPLIED | FORFEITED | REFUNDED
 *
 * Dual-approval refund flow:
 *   Step 1: tenant_admin calls approveRefund()
 *   Step 2: finance_officer calls financeApproveRefund()
 *   Step 3: system calls processRefund() once both approvals are in
 */
class DepositService
{
    public function __construct(
        private readonly LedgerService $ledgerService,
    ) {}

    /**
     * Create a new deposit record for an order.
     * Calculates amount from order total × deposit rate.
     *
     * @param  Order  $order
     * @param  string $paymentMethod 'fpx' | 'duitnow' | 'manual'
     * @return Deposit
     */
    public function create(Order $order, string $paymentMethod = 'manual'): Deposit
    {
        $entity      = $order->entity;
        $rate        = $entity->getEffectiveDepositRate();
        $orderAmount = Money::of((string) $order->total_amount, 'MYR');

        // Calculate deposit amount: rate% of order total, rounded to 2dp
        $depositAmount = $orderAmount->multipliedBy(
            (string) ($rate / 100),
            \Brick\Math\RoundingMode::HALF_UP
        );

        return Deposit::create([
            'tenant_id'      => $order->tenant_id,
            'order_id'       => $order->id,
            'entity_id'      => $entity->id,
            'amount'         => $depositAmount->getAmount()->__toString(),
            'rate'           => $rate,
            'status'         => Deposit::STATUS_PENDING,
            'payment_method' => $paymentMethod,
        ]);
    }

    /**
     * Mark a deposit as received and post the ledger entry.
     * Called when payment gateway confirms receipt.
     *
     * @param  Deposit $deposit
     * @param  string  $paymentReference  Gateway transaction reference
     * @param  int     $confirmedBy       User ID confirming receipt
     */
    public function markReceived(Deposit $deposit, string $paymentReference, int $confirmedBy): void
    {
        DB::transaction(function () use ($deposit, $paymentReference, $confirmedBy) {
            $deposit->saveWithLock([
                'status'      => Deposit::STATUS_RECEIVED,
                'reference'   => $paymentReference,
                'received_at' => now(),
            ]);

            // DR Cash/Bank (1000) / CR Deposit Liability (2100)
            $this->ledgerService->post(
                entries: [
                    ['account' => '1000', 'dr' => $deposit->amount, 'cr' => '0.00'],
                    ['account' => '2100', 'dr' => '0.00', 'cr' => $deposit->amount],
                ],
                reference:   'DEP-' . $deposit->id,
                narrative:   "Deposit received: Order {$deposit->order->order_number}",
                initiatedBy: $confirmedBy,
                orderId:     $deposit->order_id,
                depositId:   $deposit->id,
                tenantId:    $deposit->tenant_id,
            );
        });
    }

    /**
     * Apply deposit against final settlement (reduces the amount owed).
     * Called during settlement processing.
     *
     * @param  Deposit $deposit
     * @param  int     $appliedBy  User ID
     */
    public function apply(Deposit $deposit, int $appliedBy): void
    {
        if ($deposit->status !== Deposit::STATUS_RECEIVED) {
            throw new InsufficientDepositException(
                "Cannot apply deposit #{$deposit->id}: status is {$deposit->status}, expected RECEIVED."
            );
        }

        DB::transaction(function () use ($deposit, $appliedBy) {
            $deposit->saveWithLock([
                'status'     => Deposit::STATUS_APPLIED,
                'applied_at' => now(),
            ]);

            // DR Deposit Liability (2100) — discharge the liability
            // CR Accounts Receivable (1100) — offset what's owed
            $this->ledgerService->post(
                entries: [
                    ['account' => '2100', 'dr' => $deposit->amount, 'cr' => '0.00'],
                    ['account' => '1100', 'dr' => '0.00', 'cr' => $deposit->amount],
                ],
                reference:   'DEP-APPLY-' . $deposit->id,
                narrative:   "Deposit applied to settlement: Order {$deposit->order->order_number}",
                initiatedBy: $appliedBy,
                orderId:     $deposit->order_id,
                depositId:   $deposit->id,
                tenantId:    $deposit->tenant_id,
            );
        });
    }

    /**
     * Step 1 of refund dual-approval: Tenant Admin approves.
     *
     * @throws \RuntimeException if deposit is not in RECEIVED status
     */
    public function requestRefund(Deposit $deposit, User $requester, string $reason): void
    {
        if ($deposit->status !== Deposit::STATUS_RECEIVED) {
            throw new \RuntimeException('Only RECEIVED deposits can be refunded.');
        }

        $deposit->update([
            'refund_requested_by' => $requester->id,
            'refund_requested_at' => now(),
            'refund_reason'       => $reason,
        ]);
    }

    /**
     * Step 2a: Tenant Admin approves the refund.
     */
    public function approveRefund(Deposit $deposit, User $approver): void
    {
        if (! $approver->hasRole('tenant_admin')) {
            throw new \RuntimeException('Only tenant admins can approve refunds.');
        }
        $deposit->approveRefund($approver);
    }

    /**
     * Step 2b: Finance Officer provides second approval.
     */
    public function financeApproveRefund(Deposit $deposit, User $financeOfficer): void
    {
        if (! $financeOfficer->hasRole('finance_officer')) {
            throw new \RuntimeException('Only finance officers can provide finance approval.');
        }
        $deposit->financeApproveRefund($financeOfficer);
    }

    /**
     * Step 3: Process the actual refund once dual-approval is complete.
     * Posts reversal ledger entries.
     *
     * @param  Deposit $deposit
     * @param  int     $processedBy User ID
     * @throws \RuntimeException if dual approval is incomplete
     */
    public function processRefund(Deposit $deposit, int $processedBy): void
    {
        if (! $deposit->hasFullRefundApproval()) {
            throw new \RuntimeException(
                'Refund requires both tenant admin and finance officer approval before processing.'
            );
        }

        DB::transaction(function () use ($deposit, $processedBy) {
            $deposit->saveWithLock([
                'status'      => Deposit::STATUS_REFUNDED,
                'refunded_at' => now(),
            ]);

            // Reverse the original deposit receipt entry
            // DR Deposit Liability (2100) / CR Cash/Bank (1000)
            $this->ledgerService->post(
                entries: [
                    ['account' => '2100', 'dr' => $deposit->amount, 'cr' => '0.00'],
                    ['account' => '1000', 'dr' => '0.00', 'cr' => $deposit->amount],
                ],
                reference:   'DEP-REFUND-' . $deposit->id,
                narrative:   "Deposit refunded: Order {$deposit->order->order_number} — {$deposit->refund_reason}",
                initiatedBy: $processedBy,
                orderId:     $deposit->order_id,
                depositId:   $deposit->id,
                tenantId:    $deposit->tenant_id,
            );
        });
    }
}
