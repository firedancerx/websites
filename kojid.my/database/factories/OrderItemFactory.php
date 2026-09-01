<?php

namespace Database\Factories;

use App\Models\OrderItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        $qty   = $this->faker->numberBetween(1, 100);
        $price = $this->faker->randomFloat(2, 10, 200);

        return [
            'tenant_id'             => Tenant::factory(),
            'order_id'              => Order::factory(),
            'product_id'            => Product::factory(),
            'product_snapshot_name' => $this->faker->word(),
            'product_snapshot_sku'  => 'SKU-' . $this->faker->bothify('###-???'),
            'product_snapshot_unit' => 'KG',
            'quantity'              => $qty,
            'unit_price'            => number_format($price, 2, '.', ''),
            'line_total'            => number_format($qty * $price, 2, '.', ''),
        ];
    }
}
