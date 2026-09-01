<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Deposit;
use App\Services\DepositService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(private readonly DepositService $depositService) {}

    public function indexDeposits(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Deposit::class);

        $deposits = Deposit::with(['order', 'entity'])
            ->visibleTo($request->user())
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->latest()
            ->paginate(25);

        return response()->json(['data' => $deposits]);
    }

    public function approveRefund(Request $request, Deposit $deposit): JsonResponse
    {
        $this->authorize('approveRefund', $deposit);
        $request->validate(['reason' => ['required', 'string', 'min:10']]);

        if (! $deposit->refund_requested_at) {
            $this->depositService->requestRefund($deposit, $request->user(), $request->reason);
        }

        $this->depositService->approveRefund($deposit, $request->user());

        return response()->json(['data' => $deposit->fresh()]);
    }

    public function financeApprove(Request $request, Deposit $deposit): JsonResponse
    {
        $this->authorize('financeApproveRefund', $deposit);

        $this->depositService->financeApproveRefund($deposit, $request->user());

        if ($deposit->fresh()->hasFullRefundApproval()) {
            $this->depositService->processRefund($deposit->fresh(), $request->user()->id);
        }

        return response()->json(['data' => $deposit->fresh()]);
    }
}
