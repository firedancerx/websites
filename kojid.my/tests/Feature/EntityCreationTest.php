<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class EntityCreationTest extends TestCase
{
    use DatabaseTransactions;

    public function test_super_admin_can_create_an_entity_for_the_active_tenant(): void
    {
        $tenant = Tenant::factory()->create();
        $user   = User::factory()->superAdmin()->create([
            'email' => 'superadmin@kojid.com.my',
        ]);
        $user->assignRole('super_admin');

        $response = $this
            ->actingAs($user)
            ->withSession([config('multitenancy.session_key') => $tenant->id])
            ->post('/entities', [
                'name' => 'Entity Save Regression Test',
                'ssm_number' => 'TEST-ENTITY-SAVE-001',
                'entity_type' => 'BUYER',
                'credit_terms' => 'COD',
                'contact_phone' => '0123456789',
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('entities', [
            'tenant_id' => $tenant->id,
            'ssm_number' => 'TEST-ENTITY-SAVE-001',
            'entity_type' => 'buyer',
            'credit_terms' => 'cod',
        ]);
        $this->assertDatabaseHas('entity_roles', [
            'tenant_id' => $tenant->id,
            'role' => 'buyer',
        ]);
    }
}
