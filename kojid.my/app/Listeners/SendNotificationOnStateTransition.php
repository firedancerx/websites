<?php

namespace App\Listeners;

use App\Events\OrderStateTransitioned;
use App\Events\GuillotinaTriggered;
use App\Services\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;

/**
 * SendNotificationOnStateTransition
 *
 * Dispatches in-app and email notifications after every order state change.
 * Queued on 'notifications' queue — lower priority than financial events.
 */
class SendNotificationOnStateTransition implements ShouldQueue
{
    public string $queue = 'notifications';
    public int    $tries = 3;

    public function __construct(private readonly NotificationService $notificationService) {}

    public function handle(OrderStateTransitioned $event): void
    {
        $this->notificationService->notifyOrderStateChange(
            $event->order,
            $event->fromState,
            $event->toState,
            $event->actor,
        );
    }

    /** Handle GuillotinaTriggered event — notify all stakeholders immediately. */
    public function handleGuillotina(GuillotinaTriggered $event): void
    {
        $this->notificationService->notifyGuillotinaFired($event->order);
    }
}
