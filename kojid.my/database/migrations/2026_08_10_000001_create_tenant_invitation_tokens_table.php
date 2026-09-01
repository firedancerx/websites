<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('tenant_invitation_tokens')) {
            Schema::create('tenant_invitation_tokens', function (Blueprint $table) {
                $table->id();
                $table->foreignId('upline_mediator_id')->constrained('tenants')->onDelete('cascade');
                $table->string('email');
                $table->string('invitation_token')->unique();
                $table->timestamp('expires_at')->nullable();
                $table->timestamp('used_at')->nullable();
                $table->timestamps();

                $table->index(['email', 'invitation_token']);
            });
        }

        // Add composite index to tenants if not present
        if (Schema::hasTable('tenants')) {
            Schema::table('tenants', function (Blueprint $table) {
                // Ensure upline_mediator_id exists
                if (!Schema::hasColumn('tenants', 'upline_mediator_id')) {
                    $table->foreignId('upline_mediator_id')->nullable()->after('id')->constrained('tenants')->onDelete('set null');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_invitation_tokens');
    }
};
