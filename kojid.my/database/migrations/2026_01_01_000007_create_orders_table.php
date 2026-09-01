<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Aggregation batches table (referenced by orders)
        Schema::create('aggregation_batches', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->enum('type', ['inbound', 'outbound']);
            $table->enum('status', ['forming', 'confirmed', 'in_transit', 'completed', 'cancelled'])->default('forming');
            $table->timestamp('scheduled_at')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('allows_mixed_temperature')->default(false);
            $table->unsignedBigInteger('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->index('tenant_id');
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('order_number', 30)->comment('MSK-YYYY-MMDD-00000 or KLR-...');
            $table->enum('type', ['inbound', 'outbound']);

            // Inbound states
            // CREATED → PENDING_ACCEPTANCE → DEPOSIT_COMMITTED → PENDING_DELIVERY
            //   → RECEIVED_STOCKED → RISK_ACQUIRED | CANCELLED_FORFEITED | CANCELLED
            // Outbound states
            // CREATED → PENDING_BUYER_DEPOSIT → DEPOSIT_CONFIRMED → PENDING_DISPATCH
            //   → IN_TRANSIT → DELIVERED → SETTLED | DISPUTED → SETTLED | ADJUSTED
            //   | CANCELLED_FORFEITED
            $table->string('status', 40);

            $table->unsignedBigInteger('entity_id')->comment('The counterparty (supplier or buyer)');
            $table->json('entity_role_snapshot')->nullable()->comment('Role at time of order creation');

            // Quad-party: links to quota holder
            $table->unsignedBigInteger('quota_holder_entity_id')->nullable();
            $table->string('settlement_type', 10)->nullable()->comment('2_party | 3_party | 4_party');

            $table->decimal('total_amount', 15, 2)->default(0.00);
            $table->decimal('deposit_rate', 5, 2)->default(30.00);
            $table->decimal('deposit_amount', 15, 2)->default(0.00);

            $table->enum('payment_terms', ['cod', 'net7', 'net14', 'net30', 'custom'])->default('cod');
            $table->integer('payment_days')->default(0);

            $table->timestamp('sla_deadline_at')->nullable();
            $table->timestamp('guillotina_triggered_at')->nullable();

            $table->unsignedBigInteger('aggregation_batch_id')->nullable();

            $table->text('notes')->nullable();
            $table->text('dispute_reason')->nullable();
            $table->timestamp('disputed_at')->nullable();
            $table->timestamp('settled_at')->nullable();

            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('last_updated_by')->nullable();

            // Optimistic locking
            $table->unsignedBigInteger('version')->default(1);

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('entity_id')->references('id')->on('entities')->onDelete('restrict');
            $table->foreign('quota_holder_entity_id')->references('id')->on('entities')->onDelete('set null');
            $table->foreign('aggregation_batch_id')->references('id')->on('aggregation_batches')->onDelete('set null');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');

            $table->unique(['tenant_id', 'order_number'], 'orders_tenant_number_unique');
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'type']);
            $table->index('sla_deadline_at');
            $table->index('guillotina_triggered_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
        Schema::dropIfExists('aggregation_batches');
    }
};
