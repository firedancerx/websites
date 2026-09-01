<?php

namespace App\Exceptions;

use RuntimeException;

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
