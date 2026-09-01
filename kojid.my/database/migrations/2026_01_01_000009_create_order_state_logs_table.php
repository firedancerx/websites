<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Immutable audit log of every state transition.
     * NEVER allow UPDATE or DELETE on this table.
     */
    public function up(): void
    {
        Schema::create('order_state_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('order_id');
            $table->string('from_state', 40)->nullable()->comment('NULL for initial CREATED state');
            $table->string('to_state', 40);
            $table->enum('triggered_by_type', ['user', 'system', 'guillotina', 'scheduler']);
            $table->unsignedBigInteger('triggered_by_user_id')->nullable();
            $table->string('triggered_by_label')->nullable()->comment('human-readable trigger description');
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable()->comment('Any additional context data');
            $table->timestamp('triggered_at');
            // No updated_at — this table is append-only
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('restrict');
            $table->foreign('triggered_by_user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['tenant_id', 'order_id']);
            $table->index('triggered_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_state_logs');
    }
};
