<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'tenant_id'             => Tenant::factory(),
            'name'                  => $this->faker->name(),
            'email'                 => $this->faker->unique()->safeEmail(),
            'email_verified_at'     => now(),
            'password'              => Hash::make('password'),
            'locale'                => $this->faker->randomElement(['ms', 'en']),
            'is_active'             => true,
            'failed_login_attempts' => 0,
            'remember_token'        => \Illuminate\Support\Str::random(10),
        ];
    }

    public function superAdmin(): static
    {
        return $this->state(['tenant_id' => null]);
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }

    public function forTenant(Tenant $tenant): static
    {
        return $this->state(['tenant_id' => $tenant->id]);
    }
}
