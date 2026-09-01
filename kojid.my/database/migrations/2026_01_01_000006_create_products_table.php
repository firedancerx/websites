<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('category_id');
            $table->string('name');
            $table->string('name_ms')->nullable();
            $table->string('sku', 50)->comment('Stock keeping unit');
            $table->string('unit', 20)->comment('kg, tan, karung, kotak, liter, etc.');
            $table->decimal('unit_weight_kg', 10, 3)->nullable()->comment('Weight per unit in kg');
            $table->integer('shelf_life_days')->nullable()->comment('Overrides category default');
            $table->boolean('is_quota_regulated')->default(false);
            $table->string('quota_authority')->nullable()->comment('e.g. BERNAS, KPDNHEP');
            $table->decimal('cost_price', 15, 2)->nullable()->comment('Last known cost price');
            $table->decimal('selling_price', 15, 2)->nullable()->comment('Last known selling price');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('category_id')->references('id')->on('product_categories')->onDelete('restrict');
            $table->unique(['tenant_id', 'sku'], 'products_tenant_sku_unique');
            $table->index(['tenant_id', 'category_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
