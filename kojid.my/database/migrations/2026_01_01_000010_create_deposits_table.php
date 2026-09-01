<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('deposits', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('entity_id')->comment('Who paid / is receiving the deposit');
            $table->decimal('amount', 15, 2);
            $table->decimal('rate', 5, 2)->comment('Deposit rate % applied');
            $table->enum('status', ['PENDING', 'RECEIVED', 'APPLIED', 'FORFEITED', 'REFUNDED'])->default('PENDING');
            $table->string('reference')->nullable()->comment('Payment gateway reference');
            $table->string('payment_method')->nullable()->comment('fpx, duitnow, manual, etc.');

            // Lifecycle timestamps
            $table->timestamp('received_at')->nullable();
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('forfeited_at')->nullable();
            $table->timestamp('refund_requested_at')->nullable();
            $table->timestamp('refund_approved_at')->nullable();
            $table->timestamp('refunded_at')->nullable();

            // Dual-approval refund workflow
            $table->unsignedBigInteger('refund_requested_by')->nullable();
            $table->unsignedBigInteger('refund_approved_by')->nullable()->comment('Tenant Admin approval');
            $table->unsignedBigInteger('refund_finance_approved_by')->nullable()->comment('Finance Officer approval');
            $table->timestamp('refund_finance_approved_at')->nullable();
            $table->text('refund_reason')->nullable();
            $table->text('forfeiture_reason')->nullable();

            // Optimistic locking
            $table->unsignedBigInteger('version')->default(1);

            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('restrict');
            $table->foreign('entity_id')->references('id')->on('entities')->onDelete('restrict');
            $table->foreign('refund_requested_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('refund_approved_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('refund_finance_approved_by')->references('id')->on('users')->onDelete('set null');

            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'status']);
            $table->index('entity_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('deposits');
    }
};
