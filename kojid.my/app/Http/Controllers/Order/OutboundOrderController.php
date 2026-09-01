<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\CreateOutboundOrderRequest;
use App\Models\Order;
use App\Models\Entity;
use App\Models\Product;
use App\Services\OrderStateMachineService;
use App\Services\PaymentSettlementService;
use App\Services\DepositService;
use App\Services\KycService;
use App\Services\TenantContextService;
use Brick\Money\Money;
use Illuminate\Http\Request;

/**
 * OutboundOrderController
 *
 * Manages Leg 2 orders (KLR-): Tenant sells to buyer.
 * Settlement triggers 2/3/4-party payment distribution.
 */
class OutboundOrderController extends Controller
{
    public function __construct(
        private readonly OrderStateMachineService $stateMachine,
        private readonly PaymentSettlementService $settlementService,
        private readonly DepositService $depositService,
        private readonly KycService $kycService,
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Order::class);

        $orders = Order::outbound()
            ->visibleTo($request->user())
            ->with(['entity', 'items', 'deposit', 'settlement'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->search, fn ($q, $s) =>
                $q->where(function ($searchQuery) use ($s) {
                    $searchQuery->where('order_number', 'like', "%{$s}%")
                        ->orWhereHas('entity', fn ($eq) => $eq->where('name', 'like', "%{$s}%"));
                })
            )
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return view('orders.outbound.index', compact('orders'));
    }

    public function create()
    {
        $this->authorize('create', Order::class);

        $buyers = Entity::notBlacklisted()
            ->visibleTo(auth()->user())
            ->whereHas('activeRoles', fn ($q) => $q->where('role', 'buyer'))
            ->orderBy('name')
            ->get();

        $quotaHolders = Entity::visibleTo(auth()->user())
            ->whereHas('activeRoles', fn ($q) => $q->where('role', 'quota_holder'))
            ->orderBy('name')
            ->get();

        $products = Product::active()->with('category')->orderBy('name')->get();

        return view('orders.outbound.create', compact('buyers', 'quotaHolders', 'products'));
    }

    public function store(CreateOutboundOrderRequest $request)
    {
        $this->authorize('create', Order::class);

        $entity = Entity::findOrFail($request->entity_id);
        $tenant = TenantContextService::current();

        $totalAmount = collect($request->items)->reduce(function ($carry, $item) {
            return bcadd($carry, bcmul((string) $item['quantity'], (string) $item['unit_price'], 2), 2);
        }, '0.00');

        $this->kycService->assertCanTransact($entity, Money::of($totalAmount, 'MYR'));

        $order = Order::create([
            'tenant_id'               => $tenant->id,
            'type'                    => 'outbound',
            'status'                  => Order::OUTBOUND_CREATED,
            'entity_id'               => $entity->id,
            'entity_role_snapshot'    => $entity->getActiveRoleNames(),
            'quota_holder_entity_id'  => $request->quota_holder_entity_id,
            'total_amount'            => $totalAmount,
            'deposit_rate'            => $entity->getEffectiveDepositRate(),
            'deposit_amount'          => bcmul($totalAmount, (string) ($entity->getEffectiveDepositRate() / 100), 2),
            'payment_terms'           => $request->payment_terms ?? $entity->credit_terms,
            'notes'                   => $request->notes,
            'created_by'              => auth()->id(),
        ]);

        foreach ($request->items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $order->items()->create([
                'tenant_id'                => $tenant->id,
                'product_id'               => $product->id,
                'product_snapshot_name'    => $product->name,
                'product_snapshot_sku'     => $product->sku,
                'product_snapshot_unit'    => $product->unit,
                'quantity'                 => $item['quantity'],
                'unit_price'               => $item['unit_price'],
                'line_total'               => bcmul((string) $item['quantity'], (string) $item['unit_price'], 2),
                'quota_fee_per_unit'       => $item['quota_fee_per_unit'] ?? '0.00',
                'logistics_cost'           => $item['logistics_cost'] ?? '0.00',
                'shelf_life_days_snapshot' => $product->getEffectiveShelfLifeDays(),
            ]);
        }

        // Classify settlement type immediately
        $settlementType = $this->settlementService->classify($order);
        $order->update(['settlement_type' => $settlementType]);

        // Advance to PENDING_BUYER_DEPOSIT
        $this->stateMachine->transition(
            $order, Order::OUTBOUND_PENDING_BUYER_DEPOSIT,
            auth()->user(), 'user', 'Order created — awaiting buyer deposit.'
        );

        // Create pending deposit record
        $this->depositService->create($order);

        return redirect()->route('orders.outbound.show', $order)
            ->with('success', __('orders.created_successfully', ['number' => $order->order_number]));
    }

    public function show(Order $order)
    {
        $this->authorize('view', $order);

        $order->load([
            'entity', 'quotaHolder', 'items.product.category',
            'stateLogs.triggeredByUser', 'deposits', 'settlement.breakdowns.entity',
            'ledgerEntries', 'aggregationBatch',
        ]);

        $allowedTransitions = $this->stateMachine->getAllowedTransitions($order);

        return view('orders.outbound.show', compact('order', 'allowedTransitions'));
    }

    public function transition(Request $request, Order $order)
    {
        $this->authorize('update', $order);

        $request->validate([
            'action' => ['required', 'string'],
            'notes'  => ['nullable', 'string', 'max:500'],
        ]);

        $actionMap = [
            'confirm_deposit' => Order::OUTBOUND_DEPOSIT_CONFIRMED,
            'dispatch'        => Order::OUTBOUND_PENDING_DISPATCH,
            'in_transit'      => Order::OUTBOUND_IN_TRANSIT,
            'delivered'       => Order::OUTBOUND_DELIVERED,
            'settle'          => Order::OUTBOUND_SETTLED,
            'dispute'         => Order::OUTBOUND_DISPUTED,
            'cancel'          => Order::OUTBOUND_CANCELLED_FORFEITED,
        ];

        $toState = $actionMap[$request->action] ?? null;

        if (! $toState) {
            return back()->withErrors(['action' => 'Invalid transition action.']);
        }

        // If settling, run the full settlement service first
        if ($toState === Order::OUTBOUND_SETTLED) {
            $this->settlementService->settle($order, auth()->id());
            return back()->with('success', __('orders.settled_successfully'));
        }

        $this->stateMachine->transition(
            $order, $toState, auth()->user(), 'user', $request->notes
        );

        return back()->with('success', __('orders.state_transitioned', ['state' => $toState]));
    }
}
