{{-- resources/views/orders/inbound/index.blade.php --}}
@extends('layouts.app')
@section('title', __('orders.inbound_orders'))

@section('content')
<div class="space-y-4">
    <div class="page-header">
        <div>
            <h1 class="page-title">{{ __('orders.inbound_orders') }}</h1>
            <p class="page-subtitle">{{ __('orders.inbound_subtitle') }}</p>
        </div>
        @can('create', \App\Models\Order::class)
        <a href="{{ route('orders.inbound.create') }}" class="btn-primary">
            <x-icon name="plus" class="w-4 h-4"/>
            {{ __('orders.new_inbound') }}
        </a>
        @endcan
    </div>

    {{-- Filters --}}
    <form method="GET" class="flex flex-wrap gap-3 items-end">
        <div>
            <label class="form-label">{{ __('orders.search') }}</label>
            <input type="text" name="search" value="{{ request('search') }}"
                   class="form-input w-56" placeholder="{{ __('orders.search_placeholder') }}">
        </div>
        <div>
            <label class="form-label">{{ __('orders.status') }}</label>
            <select name="status" class="form-select">
                <option value="">{{ __('app.all') }}</option>
                @foreach(['CREATED','PENDING_ACCEPTANCE','DEPOSIT_COMMITTED','PENDING_DELIVERY','RECEIVED_STOCKED','RISK_ACQUIRED','CANCELLED','CANCELLED_FORFEITED'] as $s)
                    <option value="{{ $s }}" {{ request('status') === $s ? 'selected' : '' }}>{{ $s }}</option>
                @endforeach
            </select>
        </div>
        <button type="submit" class="btn-secondary">
            <x-icon name="arrow-path" class="w-4 h-4"/>
            {{ __('app.filter') }}
        </button>
    </form>

    {{-- Table --}}
    <div class="card">
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>{{ __('orders.order_number') }}</th>
                        <th>{{ __('orders.supplier') }}</th>
                        <th>{{ __('orders.status') }}</th>
                        <th>{{ __('orders.total_amount') }}</th>
                        <th>{{ __('orders.sla_deadline') }}</th>
                        <th>{{ __('orders.created_at') }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($orders as $order)
                    <tr>
                        <td>
                            <a href="{{ route('orders.inbound.show', $order) }}"
                               class="font-mono font-semibold text-kojid-green hover:underline">
                                {{ $order->order_number }}
                            </a>
                        </td>
                        <td class="text-slate-700">{{ $order->entity->name }}</td>
                        <td><x-state-badge :status="$order->status"/></td>
                        <td><x-money :amount="$order->total_amount"/></td>
                        <td>
                            @if($order->sla_deadline_at)
                                <x-guillotina-timer :order="$order"/>
                            @else
                                <span class="text-slate-400 text-xs">—</span>
                            @endif
                        </td>
                        <td class="text-slate-500 text-xs">
                            {{ $order->created_at->setTimezone('Asia/Kuala_Lumpur')->format('d M Y H:i') }}
                        </td>
                        <td>
                            <a href="{{ route('orders.inbound.show', $order) }}" class="btn-ghost btn-sm">
                                <x-icon name="eye" class="w-4 h-4"/>
                            </a>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="7" class="text-center py-12 text-slate-400">
                            <x-icon name="arrow-down-tray" class="w-10 h-10 mx-auto mb-3 opacity-30"/>
                            {{ __('orders.no_orders') }}
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($orders->hasPages())
        <div class="px-6 py-4 border-t border-slate-100">
            {{ $orders->links() }}
        </div>
        @endif
    </div>
</div>
@endsection
