<?php

namespace Database\Factories;

use App\Models\Deposit;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\Entity;
use Illuminate\Database\Eloquent\Factories\Factory;

class DepositFactory extends Factory
{
    protected $model = Deposit::class;

    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'order_id'  => Order::factory(),
            'entity_id' => Entity::factory(),
            'amount'    => number_format($this->faker->randomFloat(2, 100, 5000), 2, '.', ''),
            'rate'      => 30.00,
            'status'    => 'PENDING',
            'version'   => 1,
        ];
    }

    public function received(): static
    {
        return $this->state([
            'status'      => 'RECEIVED',
            'received_at' => now(),
        ]);
    }

    public function forTenant(Tenant $tenant): static
    {
        return $this->state(['tenant_id' => $tenant->id]);
    }
}
