<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('shipment_pl_statement_registers')) {
            Schema::create('shipment_pl_statement_registers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('shipment_ref_no')->unique();
                $table->string('merchandise_code'); // 2000-XXXX
                $table->decimal('sales_revenue', 15, 4);
                $table->decimal('cogs_avco', 15, 4);
                $table->decimal('gtp', 15, 4);
                $table->decimal('opex_subtotal', 15, 4)->default(0.0000);
                $table->decimal('noi', 15, 4);
                $table->decimal('quota_fees_subtotal', 15, 4)->default(0.0000);
                $table->decimal('net_shipment_profit', 15, 4);
                $table->timestamps();

                $table->index(['tenant_id', 'shipment_ref_no', 'merchandise_code'], 'splr_tenant_ship_code_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('shipment_pl_statement_registers');
    }
};
