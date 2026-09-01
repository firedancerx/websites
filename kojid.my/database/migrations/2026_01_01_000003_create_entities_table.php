<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name');
            $table->string('ssm_number')->comment('SSM registration number');
            $table->string('ic_owner')->nullable()->comment('IC number of owner/director');
            $table->enum('entity_type', ['supplier', 'buyer', 'quota_holder', 'intermediary']);
            $table->string('bank_account')->nullable();
            $table->string('bank_name')->nullable();
            $table->string('bank_swift')->nullable();
            $table->string('contact_phone');
            $table->string('contact_email')->nullable();
            $table->text('address')->nullable();
            $table->enum('credit_terms', ['cod', 'net7', 'net14', 'net30', 'custom'])->default('cod');
            $table->integer('credit_days')->default(0)->comment('For custom credit terms');
            $table->decimal('credit_limit', 15, 2)->default(0.00);
            $table->decimal('deposit_rate_override', 5, 2)->nullable()->comment('Overrides tenant default if set');
            $table->timestamp('verified_at')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->boolean('is_blacklisted')->default(false);
            $table->text('blacklist_reason')->nullable();
            $table->timestamp('blacklisted_at')->nullable();
            $table->json('kyc_documents')->nullable()->comment('Paths to uploaded KYC docs');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('restrict');
            $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');

            // Enforce SSM uniqueness within tenant
            $table->unique(['tenant_id', 'ssm_number'], 'entities_tenant_ssm_unique');
            // Enforce IC uniqueness within tenant (when set)
            $table->index(['tenant_id', 'ic_owner'], 'entities_tenant_ic_index');
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entities');
    }
};
