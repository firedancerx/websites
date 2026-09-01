<?php

namespace App\Http\Controllers\Order;

use App\Http\Controllers\Controller;
use App\Http\Requests\Order\CreateInboundOrderRequest;
use App\Models\Order;
use App\Models\Entity;
use App\Models\Product;
use App\Services\OrderStateMachineService;
use App\Services\DepositService;
use App\Services\KycService;
use App\Services\TenantContextService;
use Brick\Money\Money;
use Illuminate\Http\Request;

/**
 * InboundOrderController
 *
 * Manages Leg 1 orders (MSK-): Tenant buys from supplier.
 * All state transitions go through OrderStateMachineService.
 */
class InboundOrderController extends Controller
{
    public function __construct(
        private readonly OrderStateMachineService $stateMachine,
        private readonly DepositService $depositService,
        private readonly KycService $kycService,
    ) {}

    /** List all inbound orders for the current tenant with filtering. */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Order::class);

        $orders = Order::inbound()
            ->visibleTo($request->user())
            ->with(['entity', 'items', 'deposit'])
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

        return view('orders.inbound.index', compact('orders'));
    }

    /** Show create form. */
    public function create()
    {
        $this->authorize('create', Order::class);

        $suppliers = Entity::notBlacklisted()
            ->visibleTo(auth()->user())
            ->whereHas('activeRoles', fn ($q) => $q->where('role', 'supplier'))
            ->orderBy('name')
            ->get();

        $products = Product::active()->with('category')->orderBy('name')->get();

        return view('orders.inbound.create', compact('suppliers', 'products'));
    }

    /**
     * Store a new inbound order.
     * Validates entity KYC threshold before creation.
     */
    public function store(CreateInboundOrderRequest $request)
    {
        $this->authorize('create', Order::class);

        $entity  = Entity::findOrFail($request->entity_id);
        $tenant  = TenantContextService::current();

        // Calculate order total from validated line items
        $totalAmount = collect($request->items)->reduce(function ($carry, $item) {
            return bcadd($carry, bcmul((string) $item['quantity'], (string) $item['unit_price'], 2), 2);
        }, '0.00');

        // KYC threshold check
        $this->kycService->assertCanTransact($entity, Money::of($totalAmount, 'MYR'));

        $order = Order::create([
            'tenant_id'             => $tenant->id,
            'type'                  => 'inbound',
            'status'                => Order::INBOUND_CREATED,
            'entity_id'             => $entity->id,
            'entity_role_snapshot'  => $entity->getActiveRoleNames(),
            'total_amount'          => $totalAmount,
            'deposit_rate'          => $entity->getEffectiveDepositRate(),
            'deposit_amount'        => bcmul($totalAmount, (string) ($entity->getEffectiveDepositRate() / 100), 2),
            'payment_terms'         => $request->payment_terms ?? $entity->credit_terms,
            'notes'                 => $request->notes,
            'created_by'            => auth()->id(),
        ]);

        // Create line items
        foreach ($request->items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $order->items()->create([
                'tenant_id'                  => $tenant->id,
                'product_id'                 => $product->id,
                'product_snapshot_name'      => $product->name,
                'product_snapshot_sku'       => $product->sku,
                'product_snapshot_unit'      => $product->unit,
                'quantity'                   => $item['quantity'],
                'unit_price'                 => $item['unit_price'],
                'line_total'                 => bcmul((string) $item['quantity'], (string) $item['unit_price'], 2),
                'quota_fee_per_unit'         => $item['quota_fee_per_unit'] ?? '0.00',
                'logistics_cost'             => $item['logistics_cost'] ?? '0.00',
                'shelf_life_days_snapshot'   => $product->getEffectiveShelfLifeDays(),
            ]);
        }

        // Advance to PENDING_ACCEPTANCE immediately
        $this->stateMachine->transition(
            $order, Order::INBOUND_PENDING_ACCEPTANCE,
            auth()->user(), 'user', 'Order created and submitted for acceptance.'
        );

        return redirect()->route('orders.inbound.show', $order)
            ->with('success', __('orders.created_successfully', ['number' => $order->order_number]));
    }

    /** Show a single inbound order with full history. */
    public function show(Order $order)
    {
        $this->authorize('view', $order);

        $order->load(['entity', 'items.product.category', 'stateLogs.triggeredByUser',
                      'deposits', 'ledgerEntries', 'aggregationBatch']);

        $allowedTransitions = $this->stateMachine->getAllowedTransitions($order);

        return view('orders.inbound.show', compact('order', 'allowedTransitions'));
    }

    /**
     * Transition an inbound order to a new state.
     * Action parameter maps to specific state constants.
     */
    public function transition(Request $request, Order $order)
    {
        $this->authorize('update', $order);

        $request->validate([
            'action' => ['required', 'string'],
            'notes'  => ['nullable', 'string', 'max:500'],
        ]);

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
            return back()->withErrors(['action' => 'Invalid transition action.']);
        }

        $this->stateMachine->transition(
            $order, $toState, auth()->user(), 'user', $request->notes
        );

        return back()->with('success', __('orders.state_transitioned', ['state' => $toState]));
    }
}
