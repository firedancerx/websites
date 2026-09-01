{{-- resources/views/orders/outbound/index.blade.php --}}
@extends('layouts.app')
@section('title', __('orders.outbound_orders'))

@section('content')
<div class="space-y-4">
    <div class="page-header">
        <div>
            <h1 class="page-title">{{ __('orders.outbound_orders') }}</h1>
            <p class="page-subtitle">{{ __('orders.outbound_subtitle') }}</p>
        </div>
        @can('create', \App\Models\Order::class)
        <a href="{{ route('orders.outbound.create') }}" class="btn-primary">
            <x-icon name="plus" class="w-4 h-4"/>
            {{ __('orders.new_outbound') }}
        </a>
        @endcan
    </div>

    <form method="GET" class="flex flex-wrap gap-3 items-end">
        <div>
            <label class="form-label">{{ __('orders.search') }}</label>
            <input type="text" name="search" value="{{ request('search') }}" class="form-input w-56"
                   placeholder="{{ __('orders.search_placeholder') }}">
        </div>
        <div>
            <label class="form-label">{{ __('orders.status') }}</label>
            <select name="status" class="form-select">
                <option value="">{{ __('app.all') }}</option>
                @foreach(['CREATED','PENDING_BUYER_DEPOSIT','DEPOSIT_CONFIRMED','PENDING_DISPATCH','IN_TRANSIT','DELIVERED','SETTLED','DISPUTED','CANCELLED_FORFEITED'] as $s)
                    <option value="{{ $s }}" {{ request('status') === $s ? 'selected' : '' }}>{{ $s }}</option>
                @endforeach
            </select>
        </div>
        <button type="submit" class="btn-secondary">
            <x-icon name="arrow-path" class="w-4 h-4"/> {{ __('app.filter') }}
        </button>
    </form>

    <div class="card">
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>{{ __('orders.order_number') }}</th>
                        <th>{{ __('orders.buyer') }}</th>
                        <th>{{ __('orders.status') }}</th>
                        <th>{{ __('orders.settlement_type') }}</th>
                        <th>{{ __('orders.total_amount') }}</th>
                        <th>{{ __('orders.sla_deadline') }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($orders as $order)
                    <tr>
                        <td>
                            <a href="{{ route('orders.outbound.show', $order) }}"
                               class="font-mono font-semibold text-kojid-green hover:underline">
                                {{ $order->order_number }}
                            </a>
                        </td>
                        <td class="text-slate-700">{{ $order->entity->name }}</td>
                        <td><x-state-badge :status="$order->status"/></td>
                        <td>
                            @if($order->settlement_type)
                                <span class="badge badge-slate text-xs uppercase">
                                    {{ str_replace('_', '-', $order->settlement_type) }}
                                </span>
                            @else
                                <span class="text-slate-400">—</span>
                            @endif
                        </td>
                        <td><x-money :amount="$order->total_amount"/></td>
                        <td><x-guillotina-timer :order="$order"/></td>
                        <td>
                            <a href="{{ route('orders.outbound.show', $order) }}" class="btn-ghost btn-sm">
                                <x-icon name="eye" class="w-4 h-4"/>
                            </a>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="7" class="text-center py-12 text-slate-400">
                            <x-icon name="arrow-up-tray" class="w-10 h-10 mx-auto mb-3 opacity-30"/>
                            {{ __('orders.no_orders') }}
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($orders->hasPages())
        <div class="px-6 py-4 border-t border-slate-100">{{ $orders->links() }}</div>
        @endif
    </div>
</div>
@endsection
