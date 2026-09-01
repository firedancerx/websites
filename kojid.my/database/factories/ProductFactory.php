<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'tenant_id'     => Tenant::factory(),
            'category_id'   => ProductCategory::factory(),
            'name'          => $this->faker->words(3, true),
            'sku'           => strtoupper($this->faker->unique()->bothify('SKU-####-???')),
            'unit'          => $this->faker->randomElement(['KG', 'BAG', 'TON', 'LITER']),
            'selling_price' => $this->faker->randomFloat(2, 10, 500),
            'cost_price'    => $this->faker->randomFloat(2, 5, 450),
            'is_active'     => true,
        ];
    }

    public function forTenant(Tenant $tenant): static
    {
        return $this->state(['tenant_id' => $tenant->id]);
    }
}
