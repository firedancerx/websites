<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('inbound_delivery_receipts')) {
            Schema::create('inbound_delivery_receipts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->foreignId('po_document_id')->constrained('contractual_documents')->onDelete('cascade');
                $table->timestamp('receipt_date');
                $table->decimal('accepted_qty', 15, 4);
                $table->decimal('unit_cost', 15, 4);
                $table->decimal('cumulative_received_qty', 15, 4);
                $table->decimal('total_po_qty', 15, 4);
                $table->enum('status', ['AWAITING_DELIVERY_INWARDS', 'PARTIAL_DELIVERY_INWARDS', 'DELIVERY_INWARDS_COMPLETE'])->default('AWAITING_DELIVERY_INWARDS');
                $table->timestamps();

                $table->index(['tenant_id', 'po_document_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('inbound_delivery_receipts');
    }
};
