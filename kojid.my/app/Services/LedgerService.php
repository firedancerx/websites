<?php

namespace App\Services;

use App\Models\LedgerEntry;
use App\Exceptions\LedgerImbalanceException;
use Brick\Money\Money;
use Brick\Money\Currency;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * LedgerService
 *
 * The ONLY class permitted to write ledger entries.
 * Implements double-entry bookkeeping: every posting must balance (DR = CR).
 * All entries are immutable once written (enforced by DB triggers and model hooks).
 *
 * Usage:
 *   LedgerService::post([
 *     ['account' => '1000', 'dr' => '5000.00', 'cr' => '0.00'],
 *     ['account' => '2100', 'dr' => '0.00',    'cr' => '5000.00'],
 *   ], 'DEP-2026-00001', 'Deposit received from Syarikat ABC', $userId);
 *
 * Chart of accounts is defined in config/kojid.php — accounts key.
 */
class LedgerService
{
    /**
     * Post a balanced set of journal entries to the ledger.
     *
     * Each entry in $entries must have:
     *   - account   string  Account code (e.g. '1000', '2100')
     *   - dr        string  Debit amount as string decimal (use '0.00' for none)
     *   - cr        string  Credit amount as string decimal (use '0.00' for none)
     *   - narrative string  (optional) Line-level narrative; falls back to $narrative
     *
     * @param  array<array{account: string, dr: string, cr: string, narrative?: string}> $entries
     * @param  string   $reference    Transaction reference grouping these entries
     * @param  string   $narrative    Journal narrative description
     * @param  int      $initiatedBy  User ID who triggered this financial event
     * @param  int|null $orderId      Optional linked order
     * @param  int|null $depositId    Optional linked deposit
     * @param  int|null $settlementId Optional linked settlement
     * @param  int      $tenantId     Tenant scope (defaults to current tenant)
     *
     * @throws LedgerImbalanceException if debits ≠ credits
     * @throws \InvalidArgumentException if entries array is malformed
     */
    public function post(
        array $entries,
        string $reference,
        string $narrative,
        int $initiatedBy,
        ?int $orderId = null,
        ?int $depositId = null,
        ?int $settlementId = null,
        ?int $tenantId = null,
    ): void {
        $tenantId  = $tenantId ?? TenantContextService::currentId();
        $currency  = Currency::of(config('kojid.currency', 'MYR'));
        $zeroMoney = Money::zero($currency);

        // 1. Validate all entries and sum DR/CR using brick/money (never floats)
        $totalDr = $zeroMoney;
        $totalCr = $zeroMoney;

        $validated = [];
        foreach ($entries as $index => $entry) {
            if (! isset($entry['account'], $entry['dr'], $entry['cr'])) {
                throw new \InvalidArgumentException(
                    "Ledger entry #{$index} is missing required keys: account, dr, cr."
                );
            }

            $dr = Money::of((string) $entry['dr'], $currency);
            $cr = Money::of((string) $entry['cr'], $currency);

            // Each entry must be either a debit OR credit, not both
            if ($dr->isPositive() && $cr->isPositive()) {
                throw new \InvalidArgumentException(
                    "Ledger entry #{$index} has both dr and cr positive. Each entry must be one-sided."
                );
            }

            $totalDr = $totalDr->plus($dr);
            $totalCr = $totalCr->plus($cr);

            $validated[] = [
                'account'   => $entry['account'],
                'dr'        => $dr->getAmount()->__toString(),
                'cr'        => $cr->getAmount()->__toString(),
                'narrative' => $entry['narrative'] ?? $narrative,
            ];
        }

        // 2. Assert the journal balances: Total DR must equal Total CR
        if (! $totalDr->isEqualTo($totalCr)) {
            throw new LedgerImbalanceException(
                $totalDr->getAmount()->__toString(),
                $totalCr->getAmount()->__toString()
            );
        }

        // 3. Auto-generate reference if not provided
        if (empty($reference)) {
            $reference = 'TXN-' . strtoupper(Str::random(12));
        }

        // 4. Write all entries atomically inside a DB transaction
        DB::transaction(function () use (
            $validated, $reference, $narrative, $initiatedBy,
            $orderId, $depositId, $settlementId, $tenantId
        ) {
            $postedAt = now();

            foreach ($validated as $entry) {
                // LedgerEntry model has no fillable guard on tenant_id
                // because we explicitly set it here for safety
                LedgerEntry::create([
                    'tenant_id'      => $tenantId,
                    'transaction_ref' => $reference,
                    'account_code'   => $entry['account'],
                    'dr_amount'      => $entry['dr'],
                    'cr_amount'      => $entry['cr'],
                    'currency'       => 'MYR',
                    'narrative'      => $entry['narrative'],
                    'order_id'       => $orderId,
                    'deposit_id'     => $depositId,
                    'settlement_id'  => $settlementId,
                    'initiated_by'   => $initiatedBy,
                    'posted_at'      => $postedAt,
                ]);
            }
        });

        Log::info('KOJID:LedgerPosted', [
            'ref'        => $reference,
            'entries'    => count($validated),
            'total_dr'   => $totalDr->getAmount()->__toString(),
            'tenant'     => $tenantId,
            'order'      => $orderId,
        ]);
    }

    /**
     * Post a reversal entry to correct a prior posting.
     * Creates new entries with DR/CR swapped — never modifies originals.
     *
     * @param  string $originalRef  The transaction_ref of the entry to reverse
     * @param  string $reason       Why this reversal is being made
     * @param  int    $initiatedBy  User ID authorising the reversal
     */
    public function reverse(string $originalRef, string $reason, int $initiatedBy): void
    {
        $originals = LedgerEntry::where('transaction_ref', $originalRef)->get();

        if ($originals->isEmpty()) {
            throw new \InvalidArgumentException("No ledger entries found for ref: {$originalRef}");
        }

        $reversalRef = 'REV-' . $originalRef;

        $entries = $originals->map(fn ($e) => [
            'account'   => $e->account_code,
            'dr'        => $e->cr_amount, // swap DR ↔ CR
            'cr'        => $e->dr_amount,
            'narrative' => "REVERSAL of {$originalRef}: {$reason}",
        ])->toArray();

        $this->post(
            entries:     $entries,
            reference:   $reversalRef,
            narrative:   "Reversal of {$originalRef}: {$reason}",
            initiatedBy: $initiatedBy,
            tenantId:    $originals->first()->tenant_id,
        );
    }

    /**
     * Get the current balance for an account code within a tenant.
     * Balance = SUM(dr_amount) - SUM(cr_amount) for asset/expense accounts.
     *
     * @param  string $accountCode e.g. '1000'
     * @param  int    $tenantId
     * @return Money
     */
    public function getAccountBalance(string $accountCode, int $tenantId): Money
    {
        $row = LedgerEntry::where('tenant_id', $tenantId)
                          ->where('account_code', $accountCode)
                          ->selectRaw('SUM(dr_amount) as total_dr, SUM(cr_amount) as total_cr')
                          ->first();

        $dr = Money::of((string) ($row->total_dr ?? '0'), 'MYR');
        $cr = Money::of((string) ($row->total_cr ?? '0'), 'MYR');

        return $dr->minus($cr); // Net balance (DR - CR)
    }

    /**
     * Calculate the working capital position for a tenant.
     * WC = (Cash + AR + Inventory) − (AP + Deposit Liability)
     *
     * @return array{working_capital: Money, assets: Money, liabilities: Money, breakdown: array}
     */
    public function getWorkingCapitalPosition(int $tenantId): array
    {
        $assetCodes     = config('kojid.working_capital.assets');
        $liabilityCodes = config('kojid.working_capital.liabilities');

        $totalAssets      = Money::zero(\Brick\Money\Currency::of('MYR'));
        $totalLiabilities = Money::zero(\Brick\Money\Currency::of('MYR'));
        $breakdown        = [];

        foreach ($assetCodes as $code) {
            $balance            = $this->getAccountBalance($code, $tenantId);
            $totalAssets        = $totalAssets->plus($balance);
            $breakdown[$code]   = $balance;
        }

        foreach ($liabilityCodes as $code) {
            $balance            = $this->getAccountBalance($code, $tenantId);
            $totalLiabilities   = $totalLiabilities->plus($balance);
            $breakdown[$code]   = $balance;
        }

        return [
            'working_capital' => $totalAssets->minus($totalLiabilities),
            'assets'          => $totalAssets,
            'liabilities'     => $totalLiabilities,
            'breakdown'       => $breakdown,
        ];
    }

    /**
     * Generate trial balance for a tenant — all account codes with DR/CR totals.
     *
     * @return array<array{account_code: string, name: string, total_dr: string, total_cr: string, net: string}>
     */
    public function getTrialBalance(int $tenantId, ?\Carbon\Carbon $asOf = null): array
    {
        $query = LedgerEntry::where('tenant_id', $tenantId);

        if ($asOf) {
            $query->where('posted_at', '<=', $asOf);
        }

        $rows = $query->selectRaw('account_code, SUM(dr_amount) as total_dr, SUM(cr_amount) as total_cr')
                      ->groupBy('account_code')
                      ->orderBy('account_code')
                      ->get();

        $accounts = config('kojid.accounts', []);

        return $rows->map(function ($row) use ($accounts) {
            $dr  = Money::of((string) $row->total_dr, 'MYR');
            $cr  = Money::of((string) $row->total_cr, 'MYR');
            $net = $dr->minus($cr);

            return [
                'account_code' => $row->account_code,
                'name'         => $accounts[$row->account_code] ?? 'Unknown Account',
                'total_dr'     => $dr->getAmount()->__toString(),
                'total_cr'     => $cr->getAmount()->__toString(),
                'net'          => $net->getAmount()->__toString(),
            ];
        })->toArray();
    }
}
