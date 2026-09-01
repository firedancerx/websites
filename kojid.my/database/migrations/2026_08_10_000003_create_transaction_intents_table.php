<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('transaction_intents')) {
            Schema::create('transaction_intents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('intent_code')->unique();
                $table->enum('trade_mode', ['QUOTA_SUBSIDIZED', 'NORMAL_COMMERCIAL'])->default('QUOTA_SUBSIDIZED');
                $table->string('merchandise_code'); // 2000-XXXX
                $table->decimal('quantity', 15, 4);
                $table->decimal('purchase_price_as', 15, 4);
                $table->decimal('sales_price_ab', 15, 4);
                $table->decimal('quota_fee_vs', 15, 4)->default(0.0000);
                $table->decimal('quota_fee_vb', 15, 4)->default(0.0000);
                $table->string('subsidy_picture_path')->nullable();
                $table->enum('approval_status', ['PENDING_DECISION', 'APPROVED', 'REJECTED', 'RETURNED_WITH_REMARKS'])->default('PENDING_DECISION');
                $table->enum('posting_status', ['UNPOSTED', 'POSTED'])->default('UNPOSTED');
                $table->timestamp('effective_start_date')->nullable();
                $table->timestamp('effective_end_date')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'intent_code', 'trade_mode']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_intents');
    }
};
