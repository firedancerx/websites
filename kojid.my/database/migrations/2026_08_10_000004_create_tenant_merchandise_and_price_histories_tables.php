<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tenant_merchandise_settings')) {
            Schema::create('tenant_merchandise_settings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('merchandise_code'); // 2000-XXXX
                $table->decimal('default_as_purchase_price', 15, 4);
                $table->decimal('default_ab_sales_price', 15, 4);
                $table->decimal('default_vs_quota_fee', 15, 4)->default(0.0000);
                $table->decimal('default_vb_quota_fee', 15, 4)->default(0.0000);
                $table->decimal('default_est_logistics_fee', 15, 4)->default(0.0000);
                $table->timestamps();

                $table->unique(['tenant_id', 'merchandise_code']);
            });
        }

        if (!Schema::hasTable('merchandise_price_histories')) {
            Schema::create('merchandise_price_histories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('merchandise_code'); // 2000-XXXX
                $table->enum('trade_mode', ['QUOTA_SUBSIDIZED', 'NORMAL_COMMERCIAL'])->default('QUOTA_SUBSIDIZED');
                $table->decimal('as_purchase_price', 15, 4);
                $table->decimal('ab_sales_price', 15, 4);
                $table->decimal('vs_quota_fee', 15, 4)->default(0.0000);
                $table->decimal('vb_quota_fee', 15, 4)->default(0.0000);
                $table->timestamp('effective_at');
                $table->timestamps();

                $table->index(['tenant_id', 'merchandise_code', 'effective_at'], 'mph_tenant_code_eff_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('merchandise_price_histories');
        Schema::dropIfExists('tenant_merchandise_settings');
    }
};
