<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\OrderStateMachineService;
use App\Services\PaymentSettlementService;
use App\Services\TenantContextService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * API V1 OrderController
 *
 * RESTful API for order management.
 * All responses follow the JSON:API-inspired envelope structure:
 * { "data": {...}, "meta": { "timestamp": "...", "tenant_id": "..." }, "errors": [] }
 */
class OrderController extends Controller
{
    public function __construct(
        private readonly OrderStateMachineService $stateMachine,
        private readonly PaymentSettlementService $settlementService,
    ) {}

    public function indexInbound(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Order::class);

        $orders = Order::inbound()
            ->visibleTo($request->user())
            ->with(['entity', 'items'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->paginate(20);

        return $this->success($orders);
    }

    public function showInbound(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        $order->load(['entity', 'items.product', 'stateLogs', 'deposits']);
        return $this->success($order);
    }

    public function storeInbound(Request $request): JsonResponse
    {
        $this->authorize('create', Order::class);

        return $this->error('Inbound order creation via API is not implemented yet.', 501);
    }

    public function indexOutbound(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Order::class);

        $orders = Order::outbound()
            ->visibleTo($request->user())
            ->with(['entity', 'items', 'settlement'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->paginate(20);

        return $this->success($orders);
    }

    public function showOutbound(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        $order->load(['entity', 'items.product', 'stateLogs', 'deposits', 'settlement.breakdowns']);
        return $this->success($order);
    }

    public function storeOutbound(Request $request): JsonResponse
    {
        $this->authorize('create', Order::class);

        return $this->error('Outbound order creation via API is not implemented yet.', 501);
    }

    /**
     * Transition an order state via API.
     * Body: { "action": "accept|commit_deposit|...", "notes": "optional" }
     */
    public function transitionInbound(Request $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        $request->validate(['action' => ['required', 'string'], 'notes' => ['nullable', 'string']]);

        $actionMap = [
            'accept'           => Order::INBOUND_PENDING_ACCEPTANCE,
            'commit_deposit'   => Order::INBOUND_DEPOSIT_COMMITTED,
            'confirm_delivery' => Order::INBOUND_PENDING_DELIVERY,
            'stock_received'   => Order::INBOUND_RECEIVED_STOCKED,
            'acquire_risk'     => Order::INBOUND_RISK_ACQUIRED,
            'cancel'           => Order::INBOUND_CANCELLED,
        ];

        $toState = $actionMap[$request->action] ?? null;
        if (! $toState) {
            return $this->error('Invalid action', 422);
        }

        $order = $this->stateMachine->transition($order, $toState, auth()->user(), 'user', $request->notes);
        return $this->success($order->fresh(['stateLogs']));
    }

    public function transitionOutbound(Request $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        $request->validate(['action' => ['required', 'string'], 'notes' => ['nullable', 'string']]);

        $actionMap = [
            'confirm_deposit' => Order::OUTBOUND_DEPOSIT_CONFIRMED,
            'dispatch'        => Order::OUTBOUND_PENDING_DISPATCH,
            'in_transit'      => Order::OUTBOUND_IN_TRANSIT,
            'delivered'       => Order::OUTBOUND_DELIVERED,
            'settle'          => Order::OUTBOUND_SETTLED,
            'dispute'         => Order::OUTBOUND_DISPUTED,
        ];

        $toState = $actionMap[$request->action] ?? null;
        if (! $toState) {
            return $this->error('Invalid action', 422);
        }

        if ($toState === Order::OUTBOUND_SETTLED) {
            $this->settlementService->settle($order, auth()->id());
            return $this->success($order->fresh());
        }

        $order = $this->stateMachine->transition($order, $toState, auth()->user(), 'user', $request->notes);
        return $this->success($order->fresh());
    }

    // -------------------------------------------------------------------------
    // JSON:API envelope helpers
    // -------------------------------------------------------------------------

    private function success(mixed $data, int $status = 200): JsonResponse
    {
        return response()->json([
            'data'   => $data,
            'meta'   => [
                'timestamp' => now()->toIso8601String(),
                'tenant_id' => TenantContextService::currentId(),
            ],
            'errors' => [],
        ], $status);
    }

    private function error(string $message, int $status = 400): JsonResponse
    {
        return response()->json([
            'data'   => null,
            'meta'   => ['timestamp' => now()->toIso8601String()],
            'errors' => [['message' => $message]],
        ], $status);
    }
}
