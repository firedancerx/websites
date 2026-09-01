<?php

namespace App\Http\Controllers\Report;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use App\Services\LedgerService;
use App\Services\TenantContextService;
use Illuminate\Http\Request;

/**
 * ReportController
 *
 * Serves all business reports with multi-format export (PDF, XLSX, CSV).
 * Includes: executive dashboard, trial balance, P&L, aging, ghost orders, audit trail.
 */
class ReportController extends Controller
{
    public function __construct(
        private readonly ReportService $reportService,
        private readonly LedgerService $ledgerService,
    ) {}

    public function dashboard()
    {
        abort_if(auth()->user()?->isEntityUser(), 403);

        $tenantId = TenantContextService::currentId() ?? 1;
        $data     = $this->reportService->getDashboardData($tenantId);
        return view('dashboard.index', $data);
    }

    public function trialBalance(Request $request)
    {
        abort_if($request->user()?->isEntityUser(), 403);

        $tenantId = TenantContextService::currentId() ?? 1;
        $asOf     = $request->as_of ? now()->parse($request->as_of) : null;

        $trialBalance = $this->ledgerService->getTrialBalance($tenantId, $asOf);
        $wc           = $this->ledgerService->getWorkingCapitalPosition($tenantId);

        if ($request->format === 'pdf') {
            return $this->reportService->exportPdf(
                'reports.trial-balance', compact('trialBalance', 'wc', 'asOf'),
                'trial-balance-' . now()->format('Ymd')
            );
        }

        return view('reports.trial-balance', compact('trialBalance', 'wc', 'asOf'));
    }

    public function ghostOrders(Request $request)
    {
        abort_if($request->user()?->isEntityUser(), 403);

        $tenantId = TenantContextService::currentId() ?? 1;
        $orders   = $this->reportService->getGhostOrders($tenantId);

        if ($request->format === 'pdf') {
            return $this->reportService->exportPdf(
                'reports.ghost-orders', compact('orders'),
                'ghost-orders-' . now()->format('Ymd')
            );
        }

        return view('reports.ghost-orders', compact('orders'));
    }

    public function aging(Request $request)
    {
        abort_if($request->user()?->isEntityUser(), 403);

        $tenantId    = TenantContextService::currentId() ?? 1;
        $receivables = $this->reportService->getReceivablesAging($tenantId);
        $deposits    = $this->reportService->getDepositAging($tenantId);

        return view('reports.aging', compact('receivables', 'deposits'));
    }

    public function auditTrail(Request $request)
    {
        abort_if($request->user()?->isEntityUser(), 403);

        $activities = \Spatie\Activitylog\Models\Activity::query()
            ->when($request->subject_type, fn ($q, $t) => $q->where('subject_type', "App\\Models\\{$t}"))
            ->when($request->causer_id, fn ($q, $id) => $q->where('causer_id', $id))
            ->when($request->from, fn ($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->to,   fn ($q, $d) => $q->whereDate('created_at', '<=', $d))
            ->latest()
            ->paginate(50)
            ->withQueryString();

        return view('reports.audit', compact('activities'));
    }
}
