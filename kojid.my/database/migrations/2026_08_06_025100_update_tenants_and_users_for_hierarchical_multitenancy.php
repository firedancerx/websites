<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update tenants table
        Schema::table('tenants', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_id')->nullable()->after('id');
            
            $table->foreign('parent_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('restrict');

            // Unique index scoped by parent
            $table->unique(['parent_id', 'ssm_number'], 'tenants_parent_ssm_unique');
        });

        // 2. Update users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('ic_number')->nullable()->after('email');

            // Drop standard global email unique index
            $table->dropUnique('users_email_unique');

            // Add composite unique indexes
            $table->unique(['tenant_id', 'email'], 'users_tenant_email_unique');
            $table->unique(['tenant_id', 'ic_number'], 'users_tenant_ic_unique');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_tenant_ic_unique');
            $table->dropUnique('users_tenant_email_unique');
            
            $table->unique('email', 'users_email_unique');
            
            $table->dropColumn('ic_number');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropUnique('tenants_parent_ssm_unique');
            $table->dropColumn('parent_id');
        });
    }
};
