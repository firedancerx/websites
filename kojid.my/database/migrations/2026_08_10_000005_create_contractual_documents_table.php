<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('contractual_documents')) {
            Schema::create('contractual_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('mediator_tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->enum('trade_mode', ['QUOTA_SUBSIDIZED', 'NORMAL_COMMERCIAL'])->default('QUOTA_SUBSIDIZED');
                $table->string('intent_code');
                $table->string('doc_no')->unique();
                $table->string('doc_name');
                $table->enum('doc_type', ['PROFORMA_PO', 'PROFORMA_SO', 'PURCHASE_ORDER', 'SALES_ORDER']);
                $table->foreignId('recipient_tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->boolean('is_selected')->default(true);
                $table->timestamps();

                $table->index(['mediator_tenant_id', 'intent_code', 'doc_type'], 'cd_med_intent_doctype_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('contractual_documents');
    }
};
