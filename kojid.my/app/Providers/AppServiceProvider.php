<?php

namespace App\Providers;

use App\Models\Order;
use App\Models\Entity;
use App\Models\Deposit;
use App\Models\LedgerEntry;
use App\Policies\OrderPolicy;
use App\Policies\EntityPolicy;
use App\Policies\DepositPolicy;
use App\Policies\LedgerEntryPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies
        Gate::policy(Order::class, OrderPolicy::class);
        Gate::policy(Entity::class, EntityPolicy::class);
        Gate::policy(Deposit::class, DepositPolicy::class);
        Gate::policy(LedgerEntry::class, LedgerEntryPolicy::class);

        // Super admin bypasses all gates
        Gate::before(function ($user, $ability) {
            if ($user->isSuperAdmin()) {
                return true;
            }
        });
    }
}
