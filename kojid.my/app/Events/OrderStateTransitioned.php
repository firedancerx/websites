<?php

namespace App\Events;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired after every successful order state transition.
 * Listeners: CreateLedgerEntryOnStateTransition, SendNotificationOnStateTransition, StartSlaTimerOnStateTransition
 */
class OrderStateTransitioned
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Order $order,
        public readonly string $fromState,
        public readonly string $toState,
        public readonly ?User $actor = null,
    ) {}
}
