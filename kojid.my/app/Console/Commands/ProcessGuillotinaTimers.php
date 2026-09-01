<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Services\GuillotinaService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * ProcessGuillotinaTimers
 *
 * Runs every minute via the Laravel scheduler.
 * Finds all SLA-breached orders that haven't been cancelled yet
 * and fires the Guillotina execution on each.
 *
 * Uses withoutOverlapping() to prevent concurrent runs.
 *
 * Schedule: Schedule::command('kojid:process-guillotina')->everyMinute()->withoutOverlapping()
 */
class ProcessGuillotinaTimers extends Command
{
    protected $signature   = 'kojid:process-guillotina';
    protected $description = 'Execute the Guillotina on all SLA-breached ghost orders';

    public function handle(GuillotinaService $guillotinaService): int
    {
        $candidates = Order::withoutTenantScope()
                           ->scopeGuillotinaCandidates()
                           ->with(['entity', 'deposits', 'tenant', 'items'])
                           ->get();

        if ($candidates->isEmpty()) {
            $this->line('No Guillotina candidates found.');
            return self::SUCCESS;
        }

        $this->info("Found {$candidates->count()} Guillotina candidate(s). Executing...");

        $succeeded = 0;
        $failed    = 0;

        foreach ($candidates as $order) {
            try {
                $guillotinaService->execute($order);
                $this->line("  ✓ Guillotina executed: {$order->order_number} (tenant: {$order->tenant_id})");
                $succeeded++;
            } catch (\Throwable $e) {
                $failed++;
                $this->error("  ✗ Failed: {$order->order_number} — {$e->getMessage()}");
                Log::error('Guillotina execution failed', [
                    'order_id' => $order->id,
                    'error'    => $e->getMessage(),
                    'trace'    => $e->getTraceAsString(),
                ]);
            }
        }

        $this->info("Guillotina complete: {$succeeded} executed, {$failed} failed.");
        return self::SUCCESS;
    }
}
