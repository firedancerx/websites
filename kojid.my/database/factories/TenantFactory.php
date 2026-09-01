<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class TenantFactory extends Factory
{
    protected $model = Tenant::class;

    public function definition(): array
    {
        $name = $this->faker->company() . ' Sdn Bhd';
        return [
            'name'          => $name,
            'slug'          => \Illuminate\Support\Str::slug($name) . '-' . $this->faker->unique()->numberBetween(100, 999),
            'is_active'     => true,
            'contact_email' => $this->faker->companyEmail(),
            'contact_phone' => '03-' . $this->faker->numerify('########'),
            'settings'      => [
                'deposit_rate_default' => 30.00,
                'sla_timers' => [
                    'inbound'  => ['pending_acceptance' => 24, 'deposit_committed' => 48, 'pending_delivery' => 72],
                    'outbound' => ['pending_buyer_deposit' => 12, 'deposit_confirmed' => 24, 'in_transit' => 48],
                ],
            ],
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
