<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown when an order state transition is attempted that is not allowed
 * by the state machine graph, or when status is mutated directly on the model.
 */
class InvalidStateTransitionException extends RuntimeException
{
    public function __construct(
        string $message = '',
        public readonly ?string $fromState = null,
        public readonly ?string $toState = null,
        public readonly ?int $orderId = null,
    ) {
        parent::__construct($message ?: "Invalid state transition: {$fromState} → {$toState} on Order #{$orderId}");
    }
}
