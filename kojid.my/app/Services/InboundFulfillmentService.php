<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InboundFulfillmentService
{
    /**
     * Accept an inbound delivery batch against a Purchase Order.
     * Updates cumulative received qty, inventory balance (AVCO), and sends broadcast notifications.
     */
    public function acceptInboundDelivery(int $tenantId, int $poDocumentId, float $acceptedQty, float $unitCost, string $notes = ''): array
    {
        $poDoc = DB::table('contractual_documents')->where('id', $poDocumentId)->first();
        if (!$poDoc) {
            throw new InvalidArgumentException("PO Document not found.");
        }

        $intent = DB::table('transaction_intents')->where('intent_code', $poDoc->intent_code)->first();
        if (!$intent) {
            throw new InvalidArgumentException("Associated transaction intent not found.");
        }

        $totalPoQty = (float) $intent->quantity;

        // Calculate prior cumulative received qty
        $priorReceivedQty = (float) DB::table('inbound_delivery_receipts')
            ->where('po_document_id', $poDocumentId)
            ->sum('accepted_qty');

        $newCumulativeQty = $priorReceivedQty + $acceptedQty;

        if ($newCumulativeQty > $totalPoQty) {
            throw new InvalidArgumentException("OVER-DELIVERY REJECTED: Accepted quantity would exceed total PO quantity ({$totalPoQty} L).");
        }

        $newStatus = ($newCumulativeQty >= $totalPoQty) ? 'DELIVERY_INWARDS_COMPLETE' : 'PARTIAL_DELIVERY_INWARDS';

        DB::beginTransaction();
        try {
            // 1. Create Receipt Entry
            $receiptId = DB::table('inbound_delivery_receipts')->insertGetId([
                'tenant_id' => $tenantId,
                'po_document_id' => $poDocumentId,
                'receipt_date' => now(),
                'accepted_qty' => $acceptedQty,
                'unit_cost' => $unitCost,
                'cumulative_received_qty' => $newCumulativeQty,
                'total_po_qty' => $totalPoQty,
                'status' => $newStatus,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Update Inventory & Recalculate AVCO
            $lastInv = DB::table('merchandise_inventory_transactions')
                ->where('tenant_id', $tenantId)
                ->where('merchandise_code', $intent->merchandise_code)
                ->orderBy('id', 'desc')
                ->first();

            $priorBalQty = $lastInv ? (float) $lastInv->balance_qty : 0.0;
            $priorBalVal = $lastInv ? (float) $lastInv->balance_value : 0.0;

            $newBalQty = $priorBalQty + $acceptedQty;
            $newBalVal = $priorBalVal + ($acceptedQty * $unitCost);
            $newAvco = ($newBalQty > 0) ? ($newBalVal / $newBalQty) : 0.0;

            DB::table('merchandise_inventory_transactions')->insert([
                'tenant_id' => $tenantId,
                'merchandise_code' => $intent->merchandise_code,
                'doc_ref_no' => $poDoc->doc_no,
                'quota_id' => null,
                'in_qty' => $acceptedQty,
                'out_qty' => 0.0,
                'balance_qty' => $newBalQty,
                'balance_value' => $newBalVal,
                'weighted_avg_cost' => $newAvco,
                'notes' => $notes ?: "Inbound Delivery Receipt Batch #{$receiptId}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return [
                'receipt_id' => $receiptId,
                'status' => $newStatus,
                'cumulative_received_qty' => $newCumulativeQty,
                'total_po_qty' => $totalPoQty,
                'new_avco' => $newAvco
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
