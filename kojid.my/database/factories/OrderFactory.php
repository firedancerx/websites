<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Tenant;
use App\Models\Entity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $type  = $this->faker->randomElement(['inbound', 'outbound']);
        $total = $this->faker->randomFloat(2, 500, 50000);

        return [
            'tenant_id'            => Tenant::factory(),
            'order_number'         => ($type === 'inbound' ? 'MSK' : 'KLR') . '-2026-' .
                                      now()->format('md') . '-' .
                                      str_pad($this->faker->unique()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'type'                 => $type,
            'status'               => Order::INBOUND_CREATED,
            'entity_id'            => Entity::factory(),
            'entity_role_snapshot' => [$type === 'inbound' ? 'supplier' : 'buyer'],
            'total_amount'         => number_format($total, 2, '.', ''),
            'deposit_rate'         => 30.00,
            'deposit_amount'       => number_format($total * 0.3, 2, '.', ''),
            'payment_terms'        => $this->faker->randomElement(['cod', 'net7', 'net14', 'net30']),
            'sla_deadline_at'      => now()->addHours(24),
            'created_by'           => User::factory(),
            'version'              => 1,
        ];
    }

    public function inbound(): static
    {
        return $this->state([
            'type'   => 'inbound',
            'status' => Order::INBOUND_CREATED,
        ]);
    }

    public function outbound(): static
    {
        return $this->state([
            'type'   => 'outbound',
            'status' => Order::OUTBOUND_CREATED,
        ]);
    }

    public function pastSlaDeadline(): static
    {
        return $this->state(['sla_deadline_at' => now()->subHours(2)]);
    }

    public function forTenant(Tenant $tenant): static
    {
        return $this->state(['tenant_id' => $tenant->id]);
    }
}
