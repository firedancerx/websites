<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('payment_valuation_registers')) {
            Schema::create('payment_valuation_registers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('quota_master_id');
                $table->timestamp('payment_date');
                $table->decimal('as_val', 15, 4)->default(0.0000);
                $table->decimal('vs_val', 15, 4)->default(0.0000);
                $table->decimal('vb_val', 15, 4)->default(0.0000);
                $table->decimal('ab_val', 15, 4)->default(0.0000);
                $table->timestamps();

                $table->index(['tenant_id', 'quota_master_id', 'payment_date'], 'pvr_tenant_quota_date_idx');
            });
        }

        if (!Schema::hasTable('merchandise_inventory_transactions')) {
            Schema::create('merchandise_inventory_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('merchandise_code'); // 2000-XXXX
                $table->string('doc_ref_no');
                $table->string('quota_id')->nullable();
                $table->decimal('in_qty', 15, 4)->default(0.0000);
                $table->decimal('out_qty', 15, 4)->default(0.0000);
                $table->decimal('balance_qty', 15, 4)->default(0.0000);
                $table->decimal('balance_value', 15, 4)->default(0.0000);
                $table->decimal('weighted_avg_cost', 15, 4)->default(0.0000);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'merchandise_code', 'doc_ref_no'], 'mit_tenant_code_doc_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('merchandise_inventory_transactions');
        Schema::dropIfExists('payment_valuation_registers');
    }
};
