<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Quantum Actor Model: One entity can hold multiple roles simultaneously.
     * e.g. Syarikat ABC can be supplier + quota_holder in the same tenant context.
     */
    public function up(): void
    {
        Schema::create('entity_roles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('entity_id');
            $table->unsignedBigInteger('tenant_id');
            $table->enum('role', ['supplier', 'buyer', 'quota_holder', 'intermediary']);
            $table->boolean('is_primary')->default(false)->comment('The dominant role for this entity');
            $table->string('activated_by_transaction_type')->nullable()->comment('Which transaction type activated this role');
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by');
            $table->timestamp('revoked_at')->nullable();
            $table->unsignedBigInteger('revoked_by')->nullable();
            $table->timestamps();

            $table->foreign('entity_id')->references('id')->on('entities')->onDelete('cascade');
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('restrict');
            $table->foreign('revoked_by')->references('id')->on('users')->onDelete('set null');

            // One entity can hold each role type once per tenant
            $table->unique(['entity_id', 'tenant_id', 'role'], 'entity_roles_unique');
            $table->index(['tenant_id', 'entity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entity_roles');
    }
};
