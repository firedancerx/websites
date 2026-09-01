<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('order_id');
            $table->unsignedBigInteger('product_id');
            $table->string('product_snapshot_name')->comment('Name at time of order');
            $table->string('product_snapshot_sku', 50);
            $table->string('product_snapshot_unit', 20);
            $table->decimal('quantity', 15, 3);
            $table->decimal('unit_price', 15, 2)->comment('Price per unit');
            $table->decimal('line_total', 15, 2)->comment('quantity * unit_price');
            $table->decimal('quota_fee_per_unit', 15, 2)->default(0.00)->comment('Quota fee per unit if applicable');
            $table->decimal('logistics_cost', 15, 2)->default(0.00);
            $table->integer('shelf_life_days_snapshot')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('batch_number')->nullable()->comment('Product batch/lot number');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('cascade');
            $table->foreign('product_id')->references('id')->on('products')->onDelete('restrict');
            $table->index(['tenant_id', 'order_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
