<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Tenant;
use App\Models\Entity;
use App\Models\InboundOrder;
use App\Models\OutboundOrder;

class RouteCrawlTest extends TestCase
{
    public function test_every_get_route_for_super_admin()
    {
        $user = User::where('email', 'admin@kojid.com.my')->first();
        if (!$user) {
            $this->markTestSkipped('Super admin user not found.');
        }

        $tenant = Tenant::first();
        $entity = Entity::first();
        $inbound = InboundOrder::first();
        $outbound = OutboundOrder::first();

        $routes = [
            'admin.backups.index',
            'admin.tenants.index',
            'admin.tenants.create',
            'dashboard',
            'entities.index',
            'entities.create',
            'entities.pdf',
            'ledger.index',
            'orders.inbound.index',
            'orders.inbound.create',
            'orders.outbound.index',
            'orders.outbound.create',
            'deposits.index',
            'quota.balance',
            'quota.create',
            'quota.queue',
            'reports.aging',
            'reports.audit',
            'reports.ghost-orders',
            'reports.trial-balance',
        ];

        foreach ($routes as $routeName) {
            $url = route($routeName);
            $response = $this->actingAs($user)->get($url);
            $this->assertEquals(200, $response->getStatusCode(), "Route {$routeName} failed (URL: {$url})");
        }

        // Test parameterized routes
        if ($tenant) {
            $url = route('admin.tenants.edit', $tenant);
            $response = $this->actingAs($user)->get($url);
            $this->assertEquals(200, $response->getStatusCode(), "Route admin.tenants.edit failed (URL: {$url})");

            $url = route('admin.tenants.show', $tenant);
            $response = $this->actingAs($user)->get($url);
            $this->assertEquals(200, $response->getStatusCode(), "Route admin.tenants.show failed (URL: {$url})");
        }

        if ($entity) {
            $url = route('entities.show', $entity);
            $response = $this->actingAs($user)->get($url);
            $this->assertEquals(200, $response->getStatusCode(), "Route entities.show failed (URL: {$url})");
        }

        if ($inbound) {
            $url = route('orders.inbound.show', $inbound);
            $response = $this->actingAs($user)->get($url);
            $this->assertEquals(200, $response->getStatusCode(), "Route orders.inbound.show failed (URL: {$url})");
        }

        if ($outbound) {
            $url = route('orders.outbound.show', $outbound);
            $response = $this->actingAs($user)->get($url);
            $this->assertEquals(200, $response->getStatusCode(), "Route orders.outbound.show failed (URL: {$url})");
        }
    }
}
