<?php

namespace Database\Factories;

use App\Models\Entity;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

class EntityFactory extends Factory
{
    protected $model = Entity::class;

    public function definition(): array
    {
        return [
            'tenant_id'     => Tenant::factory(),
            'name'          => $this->faker->company() . ' Sdn Bhd',
            'ssm_number'    => 'SSM-' . $this->faker->unique()->numerify('######'),
            'ic_owner'      => $this->faker->numerify('######-##-####'),
            'entity_type'   => $this->faker->randomElement(['supplier', 'buyer', 'quota_holder']),
            'bank_account'  => $this->faker->numerify('####-####-####'),
            'bank_name'     => $this->faker->randomElement(['Maybank', 'CIMB', 'Public Bank', 'RHB', 'Hong Leong']),
            'contact_phone' => '01' . $this->faker->numerify('#-#######'),
            'contact_email' => $this->faker->companyEmail(),
            'address'       => $this->faker->address(),
            'credit_terms'  => $this->faker->randomElement(['cod', 'net7', 'net14', 'net30']),
            'verified_at'   => now(),
            'is_blacklisted' => false,
        ];
    }

    public function supplier(): static
    {
        return $this->state(['entity_type' => 'supplier']);
    }

    public function buyer(): static
    {
        return $this->state(['entity_type' => 'buyer']);
    }

    public function quotaHolder(): static
    {
        return $this->state(['entity_type' => 'quota_holder']);
    }

    public function unverified(): static
    {
        return $this->state(['verified_at' => null, 'verified_by' => null]);
    }

    public function blacklisted(): static
    {
        return $this->state([
            'is_blacklisted'   => true,
            'blacklist_reason' => 'Test blacklist',
            'blacklisted_at'   => now(),
        ]);
    }

    public function forTenant(Tenant $tenant): static
    {
        return $this->state(['tenant_id' => $tenant->id]);
    }
}
