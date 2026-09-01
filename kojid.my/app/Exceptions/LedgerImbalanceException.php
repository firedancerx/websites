<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when a ledger posting fails the debit=credit balance validation.
 */
class LedgerImbalanceException extends RuntimeException
{
    public function __construct(string $totalDr, string $totalCr)
    {
        parent::__construct(
            "Ledger imbalance detected: Total DR={$totalDr} does not equal Total CR={$totalCr}. " .
            "Every journal entry must balance."
        );
    }
}
