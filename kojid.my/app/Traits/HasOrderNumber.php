<?php

namespace App\Traits;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

/**
 * HasOrderNumber
 *
 * Generates order numbers in the format:
 *   MSK-2026-0101-00001  (inbound)
 *   KLR-2026-0101-00001  (outbound)
 *
 * Sequence is per-tenant per-day, resets at midnight.
 * Uses Redis atomic increment to handle concurrent generation safely.
 */
trait HasOrderNumber
{
    /**
     * Boot the trait — auto-generate order_number before create.
     */
    public static function bootHasOrderNumber(): void
    {
        static::creating(function ($model) {
            if (empty($model->order_number)) {
                $model->order_number = static::generateOrderNumber(
                    $model->tenant_id,
                    $model->type
                );
            }
        });
    }

    /**
     * Generate a unique, sequential order number.
     *
     * @param  int    $tenantId  The owning tenant's ID
     * @param  string $type      'inbound' or 'outbound'
     * @return string            e.g. "MSK-2026-0101-00001"
     */
    public static function generateOrderNumber(int $tenantId, string $type): string
    {
        $config   = config('kojid.order_numbers');
        $prefix   = $type === 'inbound' ? $config['inbound_prefix'] : $config['outbound_prefix'];
        $seqLen   = $config['sequence_length'];
        $today    = now()->format('Ymd');
        $datePart = now()->format('Y-md'); // "2026-0101" format

        // Redis key expires at midnight MYT to reset daily sequence
        $redisKey   = "kojid:order_seq:{$tenantId}:{$type}:{$today}";
        $expiresSecs = now()->secondsUntilEndOfDay() + 1;

        // Atomic increment — safe under concurrent requests
        $store = app()->environment('testing') ? Cache::store() : Cache::store('redis');
        $sequence = $store->increment($redisKey);

        // Set TTL on first increment only
        if ($sequence === 1) {
            $store->put($redisKey, 1, $expiresSecs);
        }

        $seqPadded = str_pad($sequence, $seqLen, '0', STR_PAD_LEFT);

        return "{$prefix}-{$datePart}-{$seqPadded}";
    }
}
