<?php

namespace App\Jobs;

use App\Models\Settlement;
use App\Services\QuadPartySettlementService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * RecalculateQuadPartySettlement
 *
 * Dispatched when a 4-party settlement is disputed.
 * Reverses original ledger entries and recalculates with adjusted amounts.
 * Queued on 'critical' — financial corrections must be processed reliably.
 */
class RecalculateQuadPartySettlement implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int    $tries = 3;
    public string $queue = 'critical';

    public function __construct(
        private readonly Settlement $settlement,
        private readonly array      $newAmounts,
        private readonly int        $adjustedBy,
    ) {}

    public function handle(QuadPartySettlementService $service): void
    {
        Log::info('RecalculateQuadPartySettlement: starting', [
            'settlement_id' => $this->settlement->id,
            'new_amounts'   => $this->newAmounts,
        ]);

        $newSettlement = $service->recalculate(
            $this->settlement,
            $this->newAmounts,
            $this->adjustedBy,
        );

        Log::info('RecalculateQuadPartySettlement: complete', [
            'old_settlement_id' => $this->settlement->id,
            'new_settlement_id' => $newSettlement->id,
        ]);
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('RecalculateQuadPartySettlement: failed', [
            'settlement_id' => $this->settlement->id,
            'error'         => $exception->getMessage(),
        ]);
    }
}
