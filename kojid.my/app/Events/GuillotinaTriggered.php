<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** Fired when the Guillotina executes on an SLA-breached order. */
class GuillotinaTriggered
{
    use Dispatchable, SerializesModels;

    public function __construct(public readonly Order $order) {}
}
