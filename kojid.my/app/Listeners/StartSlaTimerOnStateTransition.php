<?php

namespace App\Listeners;

use App\Events\OrderStateTransitioned;
use App\Models\Order;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * StartSlaTimerOnStateTransition
 *
 * Sets a Redis key with a TTL matching the SLA deadline for the new state.
 * The ProcessGuillotinaTimers command polls the DB; Redis is used for
 * fast membership checks and warning delivery timing.
 *
 * Key pattern: guillotina:{order_id}:{state}
 * TTL: seconds until SLA deadline
 */
class StartSlaTimerOnStateTransition implements ShouldQueue
{
    public string $queue = 'critical';
    public int    $tries = 5;

    public function handle(OrderStateTransitioned $event): void
    {
        $order    = $event->order;
        $toState  = $event->toState;

        // Only set timers for non-terminal states that have SLA deadlines
        if ($order->isInTerminalState() || ! $order->sla_deadline_at) {
            return;
        }

        $secondsRemaining = $order->getSecondsUntilGuillotina();

        if ($secondsRemaining === null || $secondsRemaining <= 0) {
            return;
        }

        $key = "guillotina:{$order->id}:{$toState}";

        // Store order ID in Redis so the warning command can efficiently
        // find orders approaching their deadline without full DB scans
        $store = app()->environment('testing') ? Cache::store() : Cache::store('redis');
        $store->put($key, [
            'order_id'       => $order->id,
            'tenant_id'      => $order->tenant_id,
            'order_number'   => $order->order_number,
            'state'          => $toState,
            'sla_deadline'   => $order->sla_deadline_at->toIso8601String(),
        ], $secondsRemaining);

        Log::info('KOJID:SlaTimer:Set', [
            'order_id'  => $order->id,
            'state'     => $toState,
            'expires_in' => $secondsRemaining . 's',
            'deadline'  => $order->sla_deadline_at->toDateTimeString(),
        ]);
    }
}
