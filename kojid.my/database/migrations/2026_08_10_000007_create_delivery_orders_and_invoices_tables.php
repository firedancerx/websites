<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('delivery_orders')) {
            Schema::create('delivery_orders', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('do_number')->unique();
                $table->enum('do_type', ['MSK_INWARD_DO', 'KLR_OUTWARD_DO']);
                $table->foreignId('po_so_document_id')->constrained('contractual_documents')->onDelete('cascade');
                $table->foreignId('counterparty_tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->timestamp('delivery_date');
                $table->decimal('delivered_qty', 15, 4);
                $table->enum('status', ['DELIVERED', 'CONFIRMED'])->default('DELIVERED');
                $table->timestamps();

                $table->index(['tenant_id', 'do_number', 'do_type'], 'do_tenant_num_type_idx');
            });
        }

        if (!Schema::hasTable('invoices')) {
            Schema::create('invoices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('invoice_number')->unique();
                $table->enum('invoice_type', ['MSK_INWARD_INV', 'KLR_OUTWARD_INV']);
                $table->foreignId('delivery_order_id')->constrained('delivery_orders')->onDelete('cascade');
                $table->foreignId('counterparty_tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->timestamp('invoice_date');
                $table->decimal('delivered_qty', 15, 4);
                $table->decimal('invoice_amount', 15, 4);
                $table->string('vendor_invoice_image_path')->nullable();
                $table->boolean('is_final_batch')->default(false);
                $table->enum('payment_status', ['UNPAID', 'PARTIALLY_PAID', 'PAID'])->default('UNPAID');
                $table->boolean('is_immutable')->default(false);
                $table->timestamps();

                $table->index(['tenant_id', 'invoice_number', 'payment_status', 'is_immutable'], 'inv_tenant_num_status_imm_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('delivery_orders');
    }
};
