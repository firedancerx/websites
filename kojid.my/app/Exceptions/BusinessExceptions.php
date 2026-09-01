<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when a deposit is required but has not been received or is insufficient.
 */
class InsufficientDepositException extends RuntimeException {}

/**
 * Thrown when a user attempts to access a resource belonging to a different tenant.
 */
class UnauthorizedTenantAccessException extends RuntimeException
{
    public function __construct(string $message = 'Access to this resource is not permitted for your tenant.')
    {
        parent::__construct($message);
    }
}

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

/**
 * Thrown when an optimistic lock conflict is detected on a versioned record.
 */
class StaleDataException extends RuntimeException {}

/**
 * Thrown when a business rule precondition is not met before a state transition.
 */
class PreconditionFailedException extends RuntimeException
{
    public function __construct(string $precondition, string $message = '')
    {
        parent::__construct($message ?: "Precondition failed: {$precondition}");
    }
}
