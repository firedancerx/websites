<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('service_provider_masters')) {
            Schema::create('service_provider_masters', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('provider_code');
                $table->string('provider_name');
                $table->string('service_category');
                $table->string('ssm_registration_no')->nullable();
                $table->timestamps();

                $table->unique(['tenant_id', 'provider_code']);
            });
        }

        if (!Schema::hasTable('other_expense_transactions')) {
            Schema::create('other_expense_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('expense_code');
                $table->foreignId('service_provider_id')->constrained('service_provider_masters')->onDelete('cascade');
                $table->string('quota_master_id')->nullable();
                $table->string('shipment_ref_no')->nullable();
                $table->string('expense_category');
                $table->decimal('amount', 15, 4);
                $table->timestamps();

                $table->index(['tenant_id', 'expense_code', 'shipment_ref_no'], 'oet_tenant_exp_ship_idx');
            });
        }

        if (!Schema::hasTable('inter_tenant_inbox_requests')) {
            Schema::create('inter_tenant_inbox_requests', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('request_code');
                $table->foreignId('origin_tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->foreignId('target_tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('request_type');
                $table->string('quota_id')->nullable();
                $table->json('payload_json');
                $table->enum('status', ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'REVISED_ENTRY'])->default('PENDING_APPROVAL');
                $table->foreignId('decided_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamp('decided_at')->nullable();
                $table->timestamp('revised_at')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'request_code', 'status'], 'itir_tenant_req_status_idx');
            });
        }

        if (!Schema::hasTable('corrective_entry_journals')) {
            Schema::create('corrective_entry_journals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('corrective_code');
                $table->foreignId('original_ledger_entry_id')->constrained('ledger_entries')->onDelete('cascade');
                $table->enum('corrective_type', ['CREDIT_NOTE', 'DEBIT_NOTE', 'REVERSAL_JOURNAL']);
                $table->string('reason_code');
                $table->decimal('original_amount', 15, 4);
                $table->decimal('adjustment_amount', 15, 4);
                $table->decimal('net_posted_amount', 15, 4);
                $table->foreignId('approved_by')->constrained('users')->onDelete('cascade');
                $table->timestamp('posted_at');
                $table->timestamps();

                $table->index(['tenant_id', 'corrective_code', 'corrective_type'], 'cej_tenant_code_type_idx');
            });
        }

        if (!Schema::hasTable('quota_masters')) {
            Schema::create('quota_masters', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('quota_number')->unique();
                $table->foreignId('vb_entity_id')->constrained('entities')->onDelete('cascade');
                $table->foreignId('vs_entity_id')->constrained('entities')->onDelete('cascade');
                $table->decimal('total_qty', 15, 4);
                $table->string('commodity_type');
                $table->enum('status', ['ACTIVE', 'EXHAUSTED', 'EXPIRED'])->default('ACTIVE');
                $table->timestamps();

                $table->index(['tenant_id', 'quota_number', 'status'], 'qm_tenant_quota_status_idx');
            });
        }

        if (!Schema::hasTable('quota_transaction_registers')) {
            Schema::create('quota_transaction_registers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->foreignId('quota_master_id')->constrained('quota_masters')->onDelete('cascade');
                $table->timestamp('transaction_date');
                $table->decimal('registered_qty', 15, 4)->default(0.0000);
                $table->decimal('used_qty', 15, 4)->default(0.0000);
                $table->decimal('collected_qty', 15, 4)->default(0.0000);
                $table->decimal('paid_qty', 15, 4)->default(0.0000);
                $table->timestamps();

                $table->index(['tenant_id', 'quota_master_id', 'transaction_date'], 'qtr_tenant_quota_date_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('quota_transaction_registers');
        Schema::dropIfExists('quota_masters');
        Schema::dropIfExists('corrective_entry_journals');
        Schema::dropIfExists('inter_tenant_inbox_requests');
        Schema::dropIfExists('other_expense_transactions');
        Schema::dropIfExists('service_provider_masters');
    }
};
