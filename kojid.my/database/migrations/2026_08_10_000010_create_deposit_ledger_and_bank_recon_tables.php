<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('deposit_ledger_entries')) {
            Schema::create('deposit_ledger_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('transaction_code');
                $table->timestamp('deposit_date');
                $table->foreignId('payor_tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->foreignId('payee_tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->enum('transaction_type', ['DEPOSIT_PLACEMENT', 'DEPOSIT_ADDITION', 'DEPOSIT_WITHDRAWAL', 'ORDER_COLLATERAL_LOCK']);
                $table->decimal('amount', 15, 4);
                $table->string('reference_doc_no')->nullable();
                $table->enum('verification_status', ['UNVERIFIED', 'VERIFIED'])->default('UNVERIFIED');
                $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamp('verified_at')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'transaction_code', 'verification_status'], 'dle_tenant_code_status_idx');
            });
        }

        if (!Schema::hasTable('bank_accounts')) {
            Schema::create('bank_accounts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('account_code');
                $table->string('bank_name');
                $table->string('account_number');
                $table->decimal('opening_balance', 15, 4)->default(0.0000);
                $table->timestamps();

                $table->unique(['tenant_id', 'account_code']);
            });
        }

        if (!Schema::hasTable('cash_at_bank_transactions')) {
            Schema::create('cash_at_bank_transactions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('bank_id');
                $table->timestamp('date');
                $table->string('pv_or_no')->nullable();
                $table->string('ref_no')->nullable();
                $table->string('quota_id')->nullable();
                $table->foreignId('counterparty_tenant_no')->nullable()->constrained('tenants')->onDelete('set null');
                $table->string('transaction_category');
                $table->decimal('amount', 15, 4);
                $table->enum('reconciliation_status', ['UNRECONCILED', 'RECONCILED'])->default('UNRECONCILED');
                $table->timestamp('reconciled_date')->nullable();
                $table->string('bank_statement_ref')->nullable();
                $table->date('statement_date')->nullable();
                $table->foreignId('reconciled_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamps();

                $table->index(['tenant_id', 'bank_id', 'reconciliation_status'], 'cbt_tenant_bank_recon_idx');
            });
        }

        if (!Schema::hasTable('bank_reconciliation_statements')) {
            Schema::create('bank_reconciliation_statements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('bank_id');
                $table->date('as_of_date');
                $table->decimal('cashbook_balance', 15, 4);
                $table->decimal('unpresented_payments_total', 15, 4);
                $table->decimal('uncredited_receipts_total', 15, 4);
                $table->decimal('bank_statement_balance', 15, 4);
                $table->foreignId('reconciled_by')->constrained('users')->onDelete('cascade');
                $table->timestamps();

                $table->index(['tenant_id', 'bank_id', 'as_of_date'], 'brs_tenant_bank_date_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('bank_reconciliation_statements');
        Schema::dropIfExists('cash_at_bank_transactions');
        Schema::dropIfExists('bank_accounts');
        Schema::dropIfExists('deposit_ledger_entries');
    }
};
