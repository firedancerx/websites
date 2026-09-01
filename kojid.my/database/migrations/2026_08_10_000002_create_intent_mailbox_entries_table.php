<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('intent_mailbox_entries')) {
            Schema::create('intent_mailbox_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->enum('folder', ['INBOX', 'SENT', 'DRAFT', 'ARCHIVE', 'OUTBOX'])->default('INBOX');
                $table->foreignId('sender_tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->foreignId('recipient_tenant_id')->constrained('tenants')->onDelete('cascade');
                $table->string('intent_code');
                $table->enum('intent_status', ['PENDING_DECISION', 'APPROVED', 'REJECTED', 'RETURNED_WITH_REMARKS', 'REDRAFT_REQUESTED'])->default('PENDING_DECISION');
                $table->string('subsidy_picture_path')->nullable();
                $table->boolean('editable')->default(true);
                $table->text('remarks')->nullable();
                $table->timestamps();

                $table->index(['tenant_id', 'folder', 'intent_code']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('intent_mailbox_entries');
    }
};
