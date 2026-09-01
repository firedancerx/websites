<?php

namespace App\Services;

use App\Models\AggregationBatch;
use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * AggregationService
 *
 * Groups orders into logistics batches for efficient receiving and dispatch.
 * Enforces frozen/ambient segregation unless batch allows_mixed_temperature flag is set.
 *
 * Inbound batch:  Multiple MSK- orders from different suppliers in one receiving run.
 * Outbound batch: Multiple KLR- orders to different buyers in one delivery run.
 */
class AggregationService
{
    /**
     * Create a new aggregation batch and add orders to it.
     *
     * @param  string     $type      'inbound' | 'outbound'
     * @param  array<int> $orderIds  IDs of orders to include
     * @param  User       $createdBy
     * @param  array      $options   ['scheduled_at' => Carbon, 'notes' => string, 'allow_mixed' => bool]
     *
     * @throws \InvalidArgumentException if orders violate temperature constraints
     */
    public function createBatch(string $type, array $orderIds, User $createdBy, array $options = []): AggregationBatch
    {
        $orders      = Order::whereIn('id', $orderIds)->where('type', $type)->get();
        $allowMixed  = $options['allow_mixed'] ?? config('kojid.aggregation.allow_mixed_frozen_ambient', false);

        // Validate temperature constraint
        if (! $allowMixed) {
            $this->assertTemperatureCompatibility($orders);
        }

        return DB::transaction(function () use ($type, $orders, $createdBy, $options, $allowMixed) {
            $batch = AggregationBatch::create([
                'tenant_id'                => $createdBy->tenant_id,
                'type'                     => $type,
                'status'                   => 'forming',
                'scheduled_at'             => $options['scheduled_at'] ?? null,
                'notes'                    => $options['notes'] ?? null,
                'allows_mixed_temperature' => $allowMixed,
                'created_by'               => $createdBy->id,
            ]);

            foreach ($orders as $order) {
                DB::table('order_aggregation_batch')->insert([
                    'order_id'             => $order->id,
                    'aggregation_batch_id' => $batch->id,
                    'added_at'             => now(),
                    'added_by'             => $createdBy->id,
                ]);

                // Update order's batch reference
                $order->update(['aggregation_batch_id' => $batch->id]);
            }

            return $batch;
        });
    }

    /**
     * Confirm a batch — locks the order list and sets status to confirmed.
     */
    public function confirmBatch(AggregationBatch $batch, User $confirmedBy): AggregationBatch
    {
        $batch->update(['status' => 'confirmed']);
        return $batch;
    }

    /**
     * Mark batch as in transit — propagates to all constituent outbound orders.
     */
    public function markInTransit(AggregationBatch $batch, User $actor, OrderStateMachineService $stateMachine): void
    {
        $batch->update(['status' => 'in_transit']);

        foreach ($batch->orders as $order) {
            if ($order->status === Order::OUTBOUND_PENDING_DISPATCH) {
                $stateMachine->transition($order, Order::OUTBOUND_IN_TRANSIT, $actor, 'system',
                    "Batch {$batch->id} dispatched");
            }
        }
    }

    /**
     * Complete a batch — mark all orders as delivered.
     */
    public function completeBatch(AggregationBatch $batch, User $actor, OrderStateMachineService $stateMachine): void
    {
        foreach ($batch->orders as $order) {
            if ($order->status === Order::OUTBOUND_IN_TRANSIT) {
                $stateMachine->transition($order, Order::OUTBOUND_DELIVERED, $actor, 'system',
                    "Batch {$batch->id} delivered");
            }
        }

        $batch->update(['status' => 'completed']);
    }

    /**
     * Assert all orders in the collection are temperature-compatible.
     * Frozen products cannot mix with ambient without explicit flag.
     *
     * @throws \InvalidArgumentException
     */
    private function assertTemperatureCompatibility(Collection $orders): void
    {
        $hasFrozen  = false;
        $hasAmbient = false;

        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $isFrozen = $item->product?->category?->is_frozen ?? false;
                if ($isFrozen) {
                    $hasFrozen = true;
                } else {
                    $hasAmbient = true;
                }
            }
        }

        if ($hasFrozen && $hasAmbient) {
            throw new \InvalidArgumentException(
                'Cannot batch frozen and ambient products together. ' .
                'Set allow_mixed_temperature=true to override with proper isolation.'
            );
        }
    }
}
