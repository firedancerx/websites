<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class CashbookReconciliationService
{
    /**
     * Generate formal Bank Reconciliation Statement for a bank account as of a specified date.
     * Formula: Balance per Bank Statement = Balance per Cashbook + Unpresented Payments - Uncredited Deposits
     */
    public function generateBankReconciliation(int $tenantId, string $bankId, string $asOfDate, float $openingBalance = 0.0): array
    {
        $entries = DB::table('cash_at_bank_transactions')
            ->where('tenant_id', $tenantId)
            ->where('bank_id', $bankId)
            ->where('date', '<=', $asOfDate)
            ->get();

        $cashbookBal = $openingBalance + (float) $entries->sum('amount');

        // Unpresented Payments (Outflows written in cashbook but unreconciled in bank statement)
        $unpresentedPayments = abs((float) $entries->where('reconciliation_status', 'UNRECONCILED')->where('amount', '<', 0)->sum('amount'));

        // Uncredited Deposits (Inflows received in cashbook but unreconciled in bank statement)
        $uncreditedDeposits = abs((float) $entries->where('reconciliation_status', 'UNRECONCILED')->where('amount', '>', 0)->sum('amount'));

        $adjustedBankStmtBalance = $cashbookBal + $unpresentedPayments - $uncreditedDeposits;

        return [
            'bank_id' => $bankId,
            'as_of_date' => $asOfDate,
            'cashbook_balance' => $cashbookBal,
            'unpresented_payments' => $unpresentedPayments,
            'uncredited_deposits' => $uncreditedDeposits,
            'adjusted_bank_statement_balance' => $adjustedBankStmtBalance
        ];
    }
}
