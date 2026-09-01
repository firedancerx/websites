<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settlements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('order_id');
            $table->string('reference', 50)->unique();
            $table->enum('type', ['2_party', '3_party', '4_party']);
            $table->enum('status', ['pending', 'processing', 'completed', 'disputed', 'adjusted'])->default('pending');
            $table->decimal('gross_sale_amount', 15, 2);
            $table->decimal('goods_cost', 15, 2)->default(0.00);
            $table->decimal('quota_fee', 15, 2)->default(0.00);
            $table->decimal('logistics_cost', 15, 2)->default(0.00);
            $table->decimal('gross_margin', 15, 2)->default(0.00)
                ->comment('gross_sale - goods_cost - quota_fee - logistics_cost');
            $table->decimal('margin_percent', 6, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->text('adjustment_reason')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('adjusted_by')->nullable();
            $table->timestamp('adjusted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('restrict');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('adjusted_by')->references('id')->on('users')->onDelete('set null');

            $table->index(['tenant_id', 'status']);
            $table->index('order_id');
        });

        Schema::create('settlement_breakdowns', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('settlement_id');
            $table->unsignedBigInteger('entity_id')->comment('Who receives / pays this disbursement');
            $table->enum('party_role', ['buyer', 'real_supplier', 'virtual_supplier', 'logistics', 'tenant']);
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->enum('direction', ['inflow', 'outflow'])->comment('inflow=received, outflow=paid out');
            $table->enum('status', ['pending', 'paid', 'failed'])->default('pending');
            $table->string('payment_reference')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('settlement_id')->references('id')->on('settlements')->onDelete('cascade');
            $table->foreign('entity_id')->references('id')->on('entities')->onDelete('restrict');
            $table->index(['tenant_id', 'settlement_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settlement_breakdowns');
        Schema::dropIfExists('settlements');
    }
};
