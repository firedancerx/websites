<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\LedgerEntry;
use App\Services\LedgerService;
use App\Services\TenantContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LedgerController extends Controller
{
    public function __construct(private readonly LedgerService $ledgerService) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', LedgerEntry::class);

        $entries = LedgerEntry::with(['order', 'deposit', 'initiatedBy'])
            ->visibleTo($request->user())
            ->when($request->account, fn ($q, $account) => $q->where('account_code', $account))
            ->latest('posted_at')
            ->paginate(50);

        return response()->json(['data' => $entries]);
    }

    public function trialBalance(Request $request): JsonResponse
    {
        abort_if($request->user()?->isEntityUser(), 403);

        $tenantId = TenantContextService::currentId();

        return response()->json([
            'data' => [
                'trial_balance' => $this->ledgerService->getTrialBalance($tenantId),
                'working_capital' => $this->ledgerService->getWorkingCapitalPosition($tenantId),
            ],
        ]);
    }
}
