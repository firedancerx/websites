<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ledger_entries', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('transaction_ref', 50)->comment('Groups a balanced set of DR/CR entries');
            $table->string('account_code', 10)->comment('References config/kojid.php accounts');
            $table->decimal('dr_amount', 15, 2)->default(0.00);
            $table->decimal('cr_amount', 15, 2)->default(0.00);
            $table->char('currency', 3)->default('MYR');
            $table->string('narrative');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('deposit_id')->nullable();
            $table->unsignedBigInteger('settlement_id')->nullable();
            $table->unsignedBigInteger('initiated_by')->comment('User ID who triggered this');
            $table->timestamp('posted_at')->comment('UTC — convert to MYT in presentation layer');
            // No updated_at — immutable
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('restrict');
            $table->foreign('deposit_id')->references('id')->on('deposits')->onDelete('restrict');
            $table->foreign('initiated_by')->references('id')->on('users')->onDelete('restrict');

            $table->index(['tenant_id', 'account_code']);
            $table->index(['tenant_id', 'transaction_ref']);
            $table->index('posted_at');
            $table->index('order_id');
        });

        // DB-level immutability: prevent UPDATE and DELETE on ledger_entries
        DB::unprepared('
            CREATE TRIGGER ledger_entries_no_update
            BEFORE UPDATE ON ledger_entries
            FOR EACH ROW
            SIGNAL SQLSTATE "45000"
            SET MESSAGE_TEXT = "Ledger entries are immutable. Use reversal entries to correct.";
        ');

        DB::unprepared('
            CREATE TRIGGER ledger_entries_no_delete
            BEFORE DELETE ON ledger_entries
            FOR EACH ROW
            SIGNAL SQLSTATE "45000"
            SET MESSAGE_TEXT = "Ledger entries cannot be deleted. Immutable audit record.";
        ');
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS ledger_entries_no_update');
        DB::unprepared('DROP TRIGGER IF EXISTS ledger_entries_no_delete');
        Schema::dropIfExists('ledger_entries');
    }
};
