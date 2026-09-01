<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use App\Services\TenantContextService;
use Illuminate\Http\Request;

/**
 * DashboardController
 *
 * Serves the executive dashboard with:
 * - Working capital position (real-time from ledger)
 * - Active inbound / outbound order counts
 * - Today's gross margin
 * - Ghost orders countdown list (approaching Guillotina)
 */
class DashboardController extends Controller
{
    public function __construct(private readonly ReportService $reportService) {}

    public function index(Request $request)
    {
        if ($request->user()?->isEntityUser()) {
            $user = $request->user();
            $zero = \Brick\Money\Money::of('0.00', 'MYR');

            return view('dashboard.index', [
                'working_capital' => [
                    'assets' => $zero,
                    'liabilities' => $zero,
                    'working_capital' => $zero,
                    'breakdown' => [],
                ],
                'active_inbound' => \App\Models\Order::visibleTo($user)->inbound()->active()->count(),
                'active_outbound' => \App\Models\Order::visibleTo($user)->outbound()->active()->count(),
                'today_margin' => $zero,
                'ghost_orders' => \App\Models\Order::visibleTo($user)
                    ->approachingGuillotina(4)
                    ->orderBy('sla_deadline_at')
                    ->with('entity')
                    ->get(),
                'recent_orders' => \App\Models\Order::visibleTo($user)
                    ->latest()
                    ->limit(10)
                    ->get(),
            ]);
        }

        $tenantId = TenantContextService::currentId();

        // Super admin with no tenant context: default to Master Mediator #1 (Tenant ID 1)
        if ($tenantId === null && $request->user()?->isSuperAdmin()) {
            $firstTenant = \App\Models\Tenant::find(1) ?? \App\Models\Tenant::first();
            if ($firstTenant) {
                TenantContextService::setActiveTenant($firstTenant->id);
                $tenantId = $firstTenant->id;
            }
        }

        // Still no tenant (edge case): show empty dashboard
        if ($tenantId === null) {
            $zero = \Brick\Money\Money::of('0.00', 'MYR');

            return view('dashboard.index', [
                'working_capital' => [
                    'assets' => $zero,
                    'liabilities' => $zero,
                    'working_capital' => $zero,
                    'breakdown' => [],
                ],
                'active_inbound' => 0,
                'active_outbound' => 0,
                'today_margin' => $zero,
                'ghost_orders' => collect(),
                'recent_orders' => collect(),
            ]);
        }

        $data = $this->reportService->getDashboardData($tenantId);

        return view('dashboard.index', $data);
    }
}
