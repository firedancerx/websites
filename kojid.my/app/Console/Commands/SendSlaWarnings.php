<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\GuillotinaService;
use Illuminate\Console\Command;

/**
 * SendSlaWarnings
 *
 * Sends proactive warning notifications to all stakeholders
 * when an order is 4 hours and 1 hour away from Guillotina.
 *
 * Schedule: Schedule::command('kojid:send-sla-warnings')->everyFiveMinutes()
 */
class SendSlaWarnings extends Command
{
    protected $signature   = 'kojid:send-sla-warnings';
    protected $description = 'Send Guillotina warning notifications at 4h and 1h before SLA deadline';

    public function handle(GuillotinaService $guillotinaService): int
    {
        $warningThresholds = config('kojid.guillotina.warning_hours', [4, 1]);

        foreach ($warningThresholds as $hours) {
            // Orders approaching within this many hours but not yet past deadline
            $orders = Order::withoutTenantScope()
                           ->scopeApproachingGuillotina($hours)
                           ->whereNotExists(function ($query) use ($hours) {
                               // Avoid duplicate warnings: check notification type doesn't already exist
                               $query->from('kojid_notifications')
                                     ->whereColumn('kojid_notifications.order_id', 'orders.id')
                                     ->where('type', "guillotina.warning.{$hours}h");
                           })
                           ->with(['entity', 'tenant'])
                           ->get();

            foreach ($orders as $order) {
                try {
                    $guillotinaService->sendWarning($order, $hours);
                    $this->line("  ⚠ {$hours}h warning sent: {$order->order_number}");
                } catch (\Throwable $e) {
                    $this->error("  ✗ Warning failed: {$order->order_number} — {$e->getMessage()}");
                }
            }
        }

        return self::SUCCESS;
    }
}
