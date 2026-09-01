<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kojid_notifications', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->unsignedBigInteger('user_id');
            $table->string('type', 80)->comment('e.g. order.state_changed, guillotina.warning');
            $table->string('title_ms');
            $table->string('title_en');
            $table->text('body_ms');
            $table->text('body_en');
            $table->unsignedBigInteger('order_id')->nullable();
            $table->unsignedBigInteger('deposit_id')->nullable();
            $table->string('action_url')->nullable();
            $table->json('metadata')->nullable();
            $table->enum('sent_via', ['in_app', 'email', 'both'])->default('both');
            $table->timestamp('read_at')->nullable();
            $table->timestamp('emailed_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('order_id')->references('id')->on('orders')->onDelete('set null');
            $table->foreign('deposit_id')->references('id')->on('deposits')->onDelete('set null');

            $table->index(['user_id', 'read_at']);
            $table->index(['tenant_id', 'user_id']);
            $table->index('created_at');
        });

        // Security event log — separate table for compliance
        Schema::create('security_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('event_type', 60)->comment('login, failed_login, privilege_escalation, etc.');
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at')->useCurrent();

            $table->index(['user_id', 'occurred_at']);
            $table->index(['tenant_id', 'event_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_logs');
        Schema::dropIfExists('kojid_notifications');
    }
};
