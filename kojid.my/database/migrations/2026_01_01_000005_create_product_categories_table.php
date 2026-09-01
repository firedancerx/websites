<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_categories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name');
            $table->string('name_ms')->nullable()->comment('Bahasa Melayu name');
            $table->string('code', 20)->comment('Short code e.g. BERAS, GULA, AYAM');
            $table->text('description')->nullable();
            $table->boolean('is_quota_regulated')->default(false)->comment('e.g. beras, gula require quota');
            $table->boolean('is_perishable')->default(true);
            $table->boolean('is_frozen')->default(false)->comment('Frozen requires segregation in aggregation');
            $table->integer('default_shelf_life_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->unique(['tenant_id', 'code'], 'product_categories_tenant_code_unique');
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_categories');
    }
};
