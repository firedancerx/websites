<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Create tax_rules table
        Schema::create('tax_rules', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name', 100);
            $table->decimal('rate', 5, 2)->default(0.00);
            $table->boolean('is_inclusive')->default(false);
            $table->timestamps();
        });

        // Seed basic tax rules
        DB::table('tax_rules')->insert([
            ['code' => 'SR', 'name' => 'Standard Rated (6%)', 'rate' => 6.00, 'is_inclusive' => false, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'ZR', 'name' => 'Zero Rated (0%)', 'rate' => 0.00, 'is_inclusive' => false, 'created_at' => now(), 'updated_at' => now()],
            ['code' => 'TX', 'name' => 'Exempt (0%)', 'rate' => 0.00, 'is_inclusive' => false, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 2. Create quota_claims table
        Schema::create('quota_claims', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->enum('commodity_type', ['rice', 'sugar', 'cooking_oil']);
            $table->decimal('claimed_qty', 15, 2);
            $table->enum('status', ['provisional', 'confirmed', 'rejected'])->default('provisional');
            $table->string('evidence_path')->nullable();
            $table->text('reviewer_notes')->nullable();
            $table->unsignedBigInteger('verified_by')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('verified_by')->references('id')->on('users')->onDelete('set null');
        });

        // 3. Add multicurrency to orders, deposits, ledger_entries, settlements
        Schema::table('orders', function (Blueprint $table) {
            $table->string('currency', 3)->default('MYR')->after('total_amount');
            $table->decimal('exchange_rate', 10, 4)->default(1.0000)->after('currency');
        });

        Schema::table('deposits', function (Blueprint $table) {
            $table->string('currency', 3)->default('MYR')->after('amount');
            $table->decimal('exchange_rate', 10, 4)->default(1.0000)->after('currency');
        });

        Schema::table('ledger_entries', function (Blueprint $table) {
            $table->decimal('exchange_rate', 10, 4)->default(1.0000)->after('currency');
        });

        Schema::table('settlements', function (Blueprint $table) {
            $table->string('currency', 3)->default('MYR')->after('gross_margin');
            $table->decimal('exchange_rate', 10, 4)->default(1.0000)->after('currency');
        });

        // 4. Add tax columns to order_items
        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('tax_rule_id')->nullable()->after('line_total');
            $table->decimal('tax_rate', 5, 2)->default(0.00)->after('tax_rule_id');
            $table->decimal('tax_amount', 15, 2)->default(0.00)->after('tax_rate');

            $table->foreign('tax_rule_id')->references('id')->on('tax_rules')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['tax_rule_id']);
            $table->dropColumn(['tax_rule_id', 'tax_rate', 'tax_amount']);
        });

        Schema::table('settlements', function (Blueprint $table) {
            $table->dropColumn(['currency', 'exchange_rate']);
        });

        Schema::table('ledger_entries', function (Blueprint $table) {
            $table->dropColumn(['exchange_rate']);
        });

        Schema::table('deposits', function (Blueprint $table) {
            $table->dropColumn(['currency', 'exchange_rate']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['currency', 'exchange_rate']);
        });

        Schema::dropIfExists('quota_claims');
        Schema::dropIfExists('tax_rules');
    }
};
