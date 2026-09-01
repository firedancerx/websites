<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Services\DepositService;
use App\Services\TenantContextService;
use Illuminate\Http\Request;

/**
 * DepositController — manages deposit lifecycle and dual-approval refund workflow.
 */
class DepositController extends Controller
{
    public function __construct(private readonly DepositService $depositService) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Deposit::class);

        $deposits = Deposit::with(['order', 'entity'])
            ->visibleTo($request->user())
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('created_at')
            ->paginate(25);

        return view('payments.deposits.index', compact('deposits'));
    }

    /** Step 1: Tenant Admin approves refund request. */
    public function approveRefund(Request $request, Deposit $deposit)
    {
        $this->authorize('approveRefund', $deposit);
        $request->validate(['reason' => ['required', 'string', 'min:10']]);

        if (! $deposit->refund_requested_at) {
            $this->depositService->requestRefund($deposit, auth()->user(), $request->reason);
        }

        $this->depositService->approveRefund($deposit, auth()->user());

        return back()->with('success', __('payments.refund_approved_step1'));
    }

    /** Step 2: Finance Officer final approval — triggers payout. */
    public function financeApproveRefund(Request $request, Deposit $deposit)
    {
        $this->authorize('financeApproveRefund', $deposit);

        $this->depositService->financeApproveRefund($deposit, auth()->user());

        // If both approvals are now in place, process the refund
        if ($deposit->hasFullRefundApproval()) {
            $this->depositService->processRefund($deposit, auth()->id());
        }

        return back()->with('success', __('payments.refund_processed'));
    }
}
