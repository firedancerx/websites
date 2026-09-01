@extends('layouts.app')
@section('title', __('reports.ghost_orders'))

@section('content')
<div class="space-y-5">
    <div class="page-header">
        <div>
            <h1 class="page-title flex items-center gap-2">
                <x-icon name="clock" class="w-6 h-6 text-kojid-amber"/>
                {{ __('reports.ghost_orders') }}
            </h1>
            <p class="page-subtitle">{{ __('reports.ghost_orders_subtitle') }}</p>
        </div>
        <a href="{{ route('reports.ghost-orders', ['format' => 'pdf']) }}" class="btn-secondary btn-sm">
            <x-icon name="document-arrow-down" class="w-4 h-4"/> PDF
        </a>
    </div>

    @if($orders->isEmpty())
    <div class="card">
        <div class="card-body text-center py-16">
            <x-icon name="check-circle" class="w-12 h-12 text-kojid-green mx-auto mb-3"/>
            <h3 class="font-semibold text-slate-700">{{ __('reports.no_ghost_orders') }}</h3>
            <p class="text-sm text-slate-500 mt-1">{{ __('reports.no_ghost_orders_desc') }}</p>
        </div>
    </div>
    @else
    <div class="space-y-3">
        @foreach($orders as $order)
        @php
            $secsRemaining = $order->getSecondsUntilGuillotina();
            $isOverdue     = $secsRemaining !== null && $secsRemaining <= 0;
            $isCritical    = $secsRemaining !== null && $secsRemaining <= 3600;
            $isWarning     = $secsRemaining !== null && $secsRemaining <= 14400;
        @endphp
        <div class="card border-l-4 {{ $isOverdue ? 'border-l-guillotina' : ($isCritical ? 'border-l-kojid-red' : ($isWarning ? 'border-l-kojid-amber' : 'border-l-slate-300')) }}">
            <div class="card-body flex items-center justify-between flex-wrap gap-4">
                <div class="flex items-center gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <a href="{{ $order->type === 'inbound' ? route('orders.inbound.show', $order) : route('orders.outbound.show', $order) }}"
                               class="font-mono font-bold text-slate-800 hover:text-kojid-green transition-colors">
                                {{ $order->order_number }}
                            </a>
                            <x-state-badge :status="$order->status"/>
                            <span class="badge badge-slate text-xs uppercase">{{ $order->type }}</span>
                        </div>
                        <div class="text-sm text-slate-500 mt-0.5">
                            {{ $order->entity->name }} &mdash;
                            <x-money :amount="$order->total_amount"/>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-6">
                    <div class="text-right">
                        <div class="text-xs text-slate-500 mb-0.5">{{ __('orders.sla_deadline') }}</div>
                        <div class="text-sm font-medium {{ $isOverdue ? 'text-guillotina' : ($isCritical ? 'text-kojid-red' : 'text-slate-700') }}">
                            {{ $order->sla_deadline_at?->setTimezone('Asia/Kuala_Lumpur')->format('d M Y H:i') }}
                        </div>
                    </div>
                    <x-guillotina-timer :order="$order"/>
                    <a href="{{ $order->type === 'inbound' ? route('orders.inbound.show', $order) : route('orders.outbound.show', $order) }}"
                       class="btn-secondary btn-sm shrink-0">
                        {{ __('app.view') }} →
                    </a>
                </div>
            </div>
        </div>
        @endforeach
    </div>
    @endif
</div>
@endsection
@push('scripts')
@vite('resources/js/order-state.js')
@endpush
