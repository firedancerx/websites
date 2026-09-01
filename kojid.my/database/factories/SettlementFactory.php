<?php

namespace Database\Factories;

use App\Models\Settlement;
use App\Models\Order;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class SettlementFactory extends Factory
{
    protected $model = Settlement::class;

    public function definition(): array
    {
        $gross = $this->faker->randomFloat(2, 1000, 50000);
        $cost  = number_format($gross * 0.8, 2, '.', '');
        $margin = number_format($gross * 0.2, 2, '.', '');

        return [
            'tenant_id'         => Tenant::factory(),
            'order_id'          => Order::factory(),
            'reference'         => 'SET-' . $this->faker->bothify('####-???'),
            'type'              => '4-party',
            'status'            => 'COMPLETED',
            'gross_sale_amount' => number_format($gross, 2, '.', ''),
            'goods_cost'        => $cost,
            'quota_fee'         => '0.00',
            'logistics_cost'    => '0.00',
            'gross_margin'      => $margin,
            'margin_percent'    => '20.00',
            'completed_at'      => now(),
        ];
    }
}
