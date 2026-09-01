<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

/**
 * ProductCategorySeeder
 *
 * Seeds Malaysian food commodity categories and sample products.
 * Includes quota-regulated commodities (beras, gula) and perishables.
 */
class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::where('slug', 'demo-sdn-bhd')->firstOrFail();

        $categories = [
            [
                'code' => 'BERAS', 'name' => 'Rice / Beras',  'name_ms' => 'Beras',
                'is_quota_regulated' => true,  'is_perishable' => false, 'is_frozen' => false,
                'default_shelf_life_days' => 365,
            ],
            [
                'code' => 'GULA',  'name' => 'Sugar / Gula',  'name_ms' => 'Gula',
                'is_quota_regulated' => true,  'is_perishable' => false, 'is_frozen' => false,
                'default_shelf_life_days' => 730,
            ],
            [
                'code' => 'AYAM',  'name' => 'Chicken / Ayam', 'name_ms' => 'Ayam',
                'is_quota_regulated' => false, 'is_perishable' => true,  'is_frozen' => false,
                'default_shelf_life_days' => 3,
            ],
            [
                'code' => 'AYAMBEKU', 'name' => 'Frozen Chicken', 'name_ms' => 'Ayam Beku',
                'is_quota_regulated' => false, 'is_perishable' => true, 'is_frozen' => true,
                'default_shelf_life_days' => 90,
            ],
            [
                'code' => 'IKAN',  'name' => 'Fish / Ikan',   'name_ms' => 'Ikan',
                'is_quota_regulated' => false, 'is_perishable' => true,  'is_frozen' => false,
                'default_shelf_life_days' => 2,
            ],
            [
                'code' => 'SAYUR', 'name' => 'Vegetables / Sayuran', 'name_ms' => 'Sayuran',
                'is_quota_regulated' => false, 'is_perishable' => true,  'is_frozen' => false,
                'default_shelf_life_days' => 5,
            ],
            [
                'code' => 'MINYAK', 'name' => 'Cooking Oil / Minyak Masak', 'name_ms' => 'Minyak Masak',
                'is_quota_regulated' => true, 'is_perishable' => false, 'is_frozen' => false,
                'default_shelf_life_days' => 180,
            ],
        ];

        foreach ($categories as $cat) {
            $category = ProductCategory::firstOrCreate(
                ['tenant_id' => $tenant->id, 'code' => $cat['code']],
                array_merge($cat, ['tenant_id' => $tenant->id, 'is_active' => true])
            );
            $this->command->line("  Category: {$category->name}");

            // Seed sample products per category
            $this->seedProducts($category, $tenant->id);
        }
    }

    private function seedProducts(ProductCategory $category, int $tenantId): void
    {
        $products = match ($category->code) {
            'BERAS' => [
                ['name' => 'Beras Tempatan Super', 'sku' => 'BERAS-TEMP-S', 'unit' => 'karung',
                 'unit_weight_kg' => 10.0, 'cost_price' => '21.00', 'selling_price' => '25.50',
                 'is_quota_regulated' => true, 'quota_authority' => 'BERNAS'],
                ['name' => 'Beras Wangi 5%', 'sku' => 'BERAS-W5', 'unit' => 'karung',
                 'unit_weight_kg' => 5.0, 'cost_price' => '13.00', 'selling_price' => '15.80',
                 'is_quota_regulated' => true, 'quota_authority' => 'BERNAS'],
            ],
            'GULA' => [
                ['name' => 'Gula Putih 1kg', 'sku' => 'GULA-P1KG', 'unit' => 'peket',
                 'unit_weight_kg' => 1.0, 'cost_price' => '2.60', 'selling_price' => '2.85',
                 'is_quota_regulated' => true, 'quota_authority' => 'KPDNHEP'],
            ],
            'AYAM' => [
                ['name' => 'Ayam Segar Keseluruhan', 'sku' => 'AYAM-SGR-W', 'unit' => 'ekor',
                 'unit_weight_kg' => 1.5, 'cost_price' => '8.50', 'selling_price' => '10.00',
                 'is_quota_regulated' => false, 'quota_authority' => null],
            ],
            'IKAN' => [
                ['name' => 'Ikan Kembung Segar', 'sku' => 'IKAN-KBG', 'unit' => 'kg',
                 'unit_weight_kg' => 1.0, 'cost_price' => '9.00', 'selling_price' => '12.00',
                 'is_quota_regulated' => false, 'quota_authority' => null],
            ],
            default => [],
        };

        foreach ($products as $prod) {
            Product::firstOrCreate(
                ['tenant_id' => $tenantId, 'sku' => $prod['sku']],
                array_merge($prod, [
                    'tenant_id'       => $tenantId,
                    'category_id'     => $category->id,
                    'shelf_life_days' => $category->default_shelf_life_days,
                    'is_active'       => true,
                ])
            );
        }
    }
}
