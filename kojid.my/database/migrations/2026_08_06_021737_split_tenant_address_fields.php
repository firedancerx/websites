<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn('address');
            $table->string('address_line1')->nullable()->after('contact_phone');
            $table->string('address_line2')->nullable()->after('address_line1');
            $table->string('address_line3')->nullable()->after('address_line2');
            $table->string('postcode', 10)->nullable()->after('address_line3');
            $table->string('town', 100)->nullable()->after('postcode');
            $table->string('state', 100)->nullable()->after('town');
            $table->string('country', 100)->nullable()->after('state');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('address')->nullable()->after('contact_phone');
            $table->dropColumn([
                'address_line1',
                'address_line2',
                'address_line3',
                'postcode',
                'town',
                'state',
                'country'
            ]);
        });
    }
};
