<?php

namespace App\Jobs;

use App\Models\Order;
use App\Services\PaymentSettlementService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * ProcessSettlement
 *
 * Queued job that runs settlement on an outbound order.
 * Dispatched on the 'critical' queue after order reaches DELIVERED state.
 *
 * Retries: 3 attempts with exponential backoff.
 * On failure: marks settlement as failed and alerts finance_officer.
 */
class ProcessSettlement implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int    $tries   = 3;
    public int    $timeout = 120;
    public string $queue   = 'critical';

    public function __construct(
        private readonly Order $order,
        private readonly int   $settledBy,
        private readonly array $overrides = [],
    ) {}

    public function handle(PaymentSettlementService $settlementService): void
    {
        Log::info('ProcessSettlement: starting', ['order_id' => $this->order->id]);

        $settlement = $settlementService->settle(
            $this->order,
            $this->settledBy,
            $this->overrides,
        );

        Log::info('ProcessSettlement: complete', [
            'order_id'      => $this->order->id,
            'settlement_id' => $settlement->id,
            'margin'        => $settlement->gross_margin,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('ProcessSettlement: failed after all retries', [
            'order_id' => $this->order->id,
            'error'    => $exception->getMessage(),
        ]);
    }

    /** Exponential backoff: 60s, 120s, 240s */
    public function backoff(): array
    {
        return [60, 120, 240];
    }
}
