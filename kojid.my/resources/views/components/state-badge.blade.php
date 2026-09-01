{{-- resources/views/components/state-badge.blade.php --}}
@props(['status', 'size' => 'sm'])

@php
$map = [
    // Neutral / initial
    'CREATED'               => ['class' => 'badge-slate',    'dot' => 'bg-slate-400',      'label' => __('orders.states.created')],
    'PENDING_ACCEPTANCE'    => ['class' => 'badge-slate',    'dot' => 'bg-slate-400',      'label' => __('orders.states.pending_acceptance')],
    'PENDING_BUYER_DEPOSIT' => ['class' => 'badge-slate',    'dot' => 'bg-slate-400',      'label' => __('orders.states.pending_buyer_deposit')],
    'PENDING_DISPATCH'      => ['class' => 'badge-slate',    'dot' => 'bg-slate-400',      'label' => __('orders.states.pending_dispatch')],
    // Amber / in-progress
    'DEPOSIT_COMMITTED'     => ['class' => 'badge-amber',    'dot' => 'bg-amber-400',      'label' => __('orders.states.deposit_committed')],
    'DEPOSIT_CONFIRMED'     => ['class' => 'badge-amber',    'dot' => 'bg-amber-400',      'label' => __('orders.states.deposit_confirmed')],
    'PENDING_DELIVERY'      => ['class' => 'badge-amber',    'dot' => 'bg-amber-500',      'label' => __('orders.states.pending_delivery')],
    'IN_TRANSIT'            => ['class' => 'badge-amber',    'dot' => 'bg-amber-500 animate-ping', 'label' => __('orders.states.in_transit')],
    'DELIVERED'             => ['class' => 'badge-amber',    'dot' => 'bg-amber-400',      'label' => __('orders.states.delivered')],
    'DISPUTED'              => ['class' => 'badge-amber',    'dot' => 'bg-amber-600',      'label' => __('orders.states.disputed')],
    // Green / terminal positive
    'RECEIVED_STOCKED'      => ['class' => 'badge-green',   'dot' => 'bg-green-500',      'label' => __('orders.states.received_stocked')],
    'RISK_ACQUIRED'         => ['class' => 'badge-green',   'dot' => 'bg-green-600',      'label' => __('orders.states.risk_acquired')],
    'SETTLED'               => ['class' => 'badge-green',   'dot' => 'bg-green-600',      'label' => __('orders.states.settled')],
    'ADJUSTED'              => ['class' => 'badge-green',   'dot' => 'bg-green-400',      'label' => __('orders.states.adjusted')],
    // Red / terminal negative
    'CANCELLED'             => ['class' => 'badge-red',     'dot' => 'bg-red-400',        'label' => __('orders.states.cancelled')],
    'CANCELLED_FORFEITED'   => ['class' => 'badge-guillotina', 'dot' => 'bg-guillotina',  'label' => __('orders.states.cancelled_forfeited')],
];
$state = $map[$status] ?? ['class' => 'badge-slate', 'dot' => 'bg-slate-300', 'label' => $status];
@endphp

<span class="{{ $state['class'] }}">
    <span class="w-1.5 h-1.5 rounded-full {{ $state['dot'] }} shrink-0"></span>
    {{ $state['label'] }}
</span>
