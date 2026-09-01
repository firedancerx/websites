<?php

namespace App\Http\Controllers\Ledger;

use App\Http\Controllers\Controller;
use App\Models\LedgerEntry;
use App\Services\LedgerService;
use App\Services\TenantContextService;
use Illuminate\Http\Request;

/**
 * LedgerController — read-only ledger views.
 * All writes go through LedgerService::post() only.
 */
class LedgerController extends Controller
{
    public function __construct(private readonly LedgerService $ledgerService) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', LedgerEntry::class);

        $tenantId = TenantContextService::currentId();

        $entries = LedgerEntry::with(['order', 'initiatedBy'])
            ->visibleTo($request->user())
            ->when($request->account, fn ($q, $a) => $q->where('account_code', $a))
            ->when($request->from,    fn ($q, $d) => $q->whereDate('posted_at', '>=', $d))
            ->when($request->to,      fn ($q, $d) => $q->whereDate('posted_at', '<=', $d))
            ->when($request->ref,     fn ($q, $r) => $q->where('transaction_ref', 'like', "%{$r}%"))
            ->orderByDesc('posted_at')
            ->paginate(50)
            ->withQueryString();

        $accounts = config('kojid.accounts');

        return view('ledger.index', compact('entries', 'accounts'));
    }

    public function trialBalance(Request $request)
    {
        abort_if($request->user()?->isEntityUser(), 403);

        $tenantId = TenantContextService::currentId();
        $asOf     = $request->as_of ? now()->parse($request->as_of) : null;

        $trialBalance = $this->ledgerService->getTrialBalance($tenantId, $asOf);
        $wc           = $this->ledgerService->getWorkingCapitalPosition($tenantId);

        if ($request->format === 'pdf') {
            return app(\App\Services\ReportService::class)->exportPdf(
                'reports.trial-balance',
                compact('trialBalance', 'wc', 'asOf'),
                'trial-balance-' . now()->format('Ymd')
            );
        }

        return view('reports.trial-balance', compact('trialBalance', 'wc', 'asOf'));
    }
}
