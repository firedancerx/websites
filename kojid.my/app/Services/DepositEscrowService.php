<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DepositEscrowService
{
    /**
     * Calculate running deposit balance for a tenant.
     * Rule: All transactions whether verified or not shall be accounted for in drawing up balances!
     */
    public function getDepositBalance(int $tenantId): float
    {
        $placements = (float) DB::table('deposit_ledger_entries')
            ->where('payee_tenant_id', $tenantId)
            ->whereIn('transaction_type', ['DEPOSIT_PLACEMENT', 'DEPOSIT_ADDITION'])
            ->sum('amount');

        $withdrawals = (float) DB::table('deposit_ledger_entries')
            ->where('payor_tenant_id', $tenantId)
            ->where('transaction_type', 'DEPOSIT_WITHDRAWAL')
            ->sum('amount');

        return $placements - $withdrawals;
    }

    /**
     * Validate withdrawal request.
     * Max Withdrawal Allowed = Deposit Balance - (Realised Liabilities + Unrealised Pending Order Liabilities)
     */
    public function validateWithdrawal(int $tenantId, float $requestedAmount, float $pendingLiabilities): array
    {
        $balance = $this->getDepositBalance($tenantId);
        $availableBuffer = $balance - $pendingLiabilities;

        if ($requestedAmount > $availableBuffer) {
            return [
                'allowed' => false,
                'message' => "WITHDRAWAL REJECTED: Requested RM {$requestedAmount} exceeds available deposit buffer (RM {$availableBuffer}).",
                'current_balance' => $balance,
                'available_buffer' => $availableBuffer
            ];
        }

        return [
            'allowed' => true,
            'message' => "WITHDRAWAL APPROVED: Requested RM {$requestedAmount} is within available deposit buffer.",
            'current_balance' => $balance,
            'available_buffer' => $availableBuffer
        ];
    }
}
