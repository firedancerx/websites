@extends('layouts.app')
@section('title', __('nav.dashboard'))

@section('content')
@php
    $isMs = app()->getLocale() === 'ms';
    $user = auth()->user();
    $isImpersonating = \App\Services\TenantContextService::isImpersonating();
    $currentTenant = \App\Services\TenantContextService::current();
    
    // Only show Root SuperAdmin Banner when NOT impersonating a tenant!
    $isSuperAdminRootView = $user && (strtolower(trim($user->email)) === 'superadmin@kojid.com.my' || $user->isSuperAdmin()) && !$isImpersonating;

    // Upline resolution
    $uplineTenant = null;
    if ($currentTenant && $currentTenant->parent_id) {
        $uplineTenant = \App\Models\Tenant::find($currentTenant->parent_id);
    } elseif ($currentTenant && !$isSuperAdminRootView && !in_array($currentTenant->id, [1, 112, 113])) {
        $uplineTenant = \App\Models\Tenant::find(1);
    }

    $ghost_orders = $ghost_orders ?? collect();
    $recent_orders = $recent_orders ?? collect();
@endphp

<div class="space-y-6">

    {{-- Page Header --}}
    <div class="page-header">
        <div>
            <h1 class="page-title">{{ __('dashboard.title') }}</h1>
            <p class="page-subtitle">
                {{ __('dashboard.subtitle') }} &mdash;
                <span class="font-medium text-slate-700">
                    {{ now()->setTimezone('Asia/Kuala_Lumpur')->format('l, d F Y, H:i') }} MYT
                </span>
            </p>
        </div>
        <a href="{{ route('reports.ghost-orders') }}" class="btn-warning btn-sm">
            <x-icon name="clock" class="w-4 h-4"/>
            {{ __('dashboard.view_ghost_orders') }}
            @if($ghost_orders->count() > 0)
                <span class="bg-white/30 text-xs rounded-full px-1.5 py-0.5 font-bold">
                    {{ $ghost_orders->count() }}
                </span>
            @endif
        </a>
    </div>

    {{-- Upline / Root Authority Section --}}
    @if($isSuperAdminRootView)
        {{-- SuperAdmin Banner --}}
        <div style="background-color: #0f172a; border: 1px solid #1e293b; padding: 20px; border-radius: 12px;" class="shadow-sm">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div style="background-color: #d97706; color: #ffffff; width: 44px; height: 44px; border-radius: 10px;" class="flex items-center justify-center shrink-0 font-black text-lg shadow">
                        👑
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span style="color: #fbbf24; font-weight: 800; font-size: 11px; text-transform: uppercase; tracking-wider: 0.05em;">
                                {{ $isMs ? 'PENTADBIR UTAMA SEJAGAT PLATFORM' : 'SOLE PLATFORM ROOT SUPER ADMIN' }}
                            </span>
                            <span style="background-color: #b45309; color: #ffffff; padding: 2px 8px; border-radius: 9999px; font-weight: 900; font-size: 10px; text-transform: uppercase;">
                                ROOT OWNER
                            </span>
                        </div>
                        <h2 style="color: #ffffff; font-weight: 900; font-size: 17px; margin-top: 2px;" class="tracking-tight">
                            {{ $user->name }} (superadmin@kojid.com.my)
                        </h2>
                        <p style="color: #94a3b8; font-weight: 600; font-size: 12px; margin-top: 2px;">
                            {{ $isMs ? 'Anda memegang kuasa tertinggi platform (Sole Super Admin Root). Tiada akaun upline di atas anda.' : 'You hold supreme platform root authority. You have no upline account above you.' }}
                        </p>
                    </div>
                </div>

                <a href="{{ route('profile') }}" 
                   style="background-color: #1e293b; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; border: 1px solid #334155; text-decoration: none;"
                   class="hover:bg-slate-700 transition-all flex items-center gap-1.5 shrink-0">
                    <x-icon name="user-circle" class="w-4 h-4 text-amber-400"/>
                    <span>{{ $isMs ? 'Profil & Kawalan Akaun' : 'My Profile & Controls' }}</span>
                </a>
            </div>
        </div>
    @elseif($uplineTenant)
        {{-- Sub-tenant Upline Mediator Banner --}}
        <div style="background-color: #f0fdf4; border: 1px solid #6ee7b7; padding: 20px; border-radius: 12px;" class="shadow-sm">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div style="background-color: #047857; color: #ffffff; width: 44px; height: 44px; border-radius: 10px;" class="flex items-center justify-center shrink-0 font-black text-lg shadow">
                        🏛️
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span style="color: #065f46; font-weight: 900; font-size: 11px; text-transform: uppercase;">
                                {{ $isMs ? 'MAKLUMAT UPLINE MASTER MEDIATOR ANDA' : 'YOUR PRIMARY UPLINE MASTER MEDIATOR' }}
                            </span>
                            <span style="background-color: #047857; color: #ffffff; padding: 2px 8px; border-radius: 9999px; font-weight: 900; font-size: 10px; text-transform: uppercase;">
                                MASTER MEDIATOR
                            </span>
                        </div>
                        <h2 style="color: #064e3b; font-weight: 900; font-size: 17px; margin-top: 2px;" class="tracking-tight">
                            {{ \Illuminate\Support\Str::title($uplineTenant->name) }}
                        </h2>
                        <div style="color: #047857; font-weight: 700; font-size: 12px; margin-top: 4px;" class="flex flex-wrap items-center gap-4">
                            <span>📧 E-mel: {{ $uplineTenant->contact_email ?? 'mediator@kojid.com.my' }}</span>
                            @if(isset($uplineTenant->contact_phone))
                                <span>📞 Tel: {{ $uplineTenant->contact_phone }}</span>
                            @endif
                            @if(isset($uplineTenant->ssm_number))
                                <span>🏢 SSM: {{ \Illuminate\Support\Str::upper($uplineTenant->ssm_number) }}</span>
                            @endif
                        </div>
                    </div>
                </div>

                <a href="{{ route('profile') }}" 
                   style="background-color: #047857; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; border: 1px solid #065f46; text-decoration: none;"
                   class="hover:bg-emerald-800 transition-all flex items-center gap-1.5 shrink-0">
                    <x-icon name="user-circle" class="w-4 h-4"/>
                    <span>{{ $isMs ? 'Profil & Hierarki Saya' : 'My Profile & Hierarchy' }}</span>
                </a>
            </div>
        </div>
    @else
        {{-- Master Mediator Root Platform Banner --}}
        <div style="background-color: #eff6ff; border: 1px solid #93c5fd; padding: 20px; border-radius: 12px;" class="shadow-sm">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <div style="background-color: #1d4ed8; color: #ffffff; width: 44px; height: 44px; border-radius: 10px;" class="flex items-center justify-center shrink-0 font-black text-lg shadow">
                        🌐
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <span style="color: #1e40af; font-weight: 900; font-size: 11px; text-transform: uppercase;">
                                {{ $isMs ? 'PENTADBIRAN SEJAGAT PLATFORM' : 'PLATFORM ROOT GOVERNANCE' }}
                            </span>
                            <span style="background-color: #1d4ed8; color: #ffffff; padding: 2px 8px; border-radius: 9999px; font-weight: 900; font-size: 10px; text-transform: uppercase;">
                                1ST-TIER MASTER HUB
                            </span>
                        </div>
                        <h2 style="color: #1e3a8a; font-weight: 900; font-size: 17px; margin-top: 2px;" class="tracking-tight">
                            Platform Root Super Admin (superadmin@kojid.com.my)
                        </h2>
                        <p style="color: #1d4ed8; font-weight: 700; font-size: 12px; margin-top: 2px;">
                            {{ $isMs ? 'Akaun anda adalah Master Mediator Utama Tingkat 1 di bawah pengawasan langsung Pentadbir Sejagat.' : 'Your account is a 1st-Tier Master Mediator under direct Platform Root oversight.' }}
                        </p>
                    </div>
                </div>

                <a href="{{ route('profile') }}" 
                   style="background-color: #1d4ed8; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; border: 1px solid #1e40af; text-decoration: none;"
                   class="hover:bg-blue-800 transition-all flex items-center gap-1.5 shrink-0">
                    <x-icon name="user-circle" class="w-4 h-4"/>
                    <span>{{ $isMs ? 'Profil Akaun' : 'My Account Profile' }}</span>
                </a>
            </div>
        </div>
    @endif

    {{-- KPI Row --}}
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {{-- Working Capital --}}
        <div class="kpi-card">
            <div class="kpi-label">{{ __('dashboard.working_capital') }}</div>
            <div class="kpi-value">
                <x-money :amount="$working_capital['working_capital']->getAmount()->__toString()" :colored="true"/>
            </div>
            <div class="text-xs text-slate-400 mt-1">
                {{ __('dashboard.assets') }}: <x-money :amount="$working_capital['assets']->getAmount()->__toString()"/>
                &minus;
                {{ __('dashboard.liabilities') }}: <x-money :amount="$working_capital['liabilities']->getAmount()->__toString()"/>
            </div>
        </div>

        {{-- Active Inbound --}}
        <div class="kpi-card">
            <div class="kpi-label">{{ __('dashboard.active_inbound') }}</div>
            <div class="kpi-value text-kojid-green">{{ $active_inbound }}</div>
            <a href="{{ route('orders.inbound.index') }}" class="text-xs text-kojid-green hover:underline mt-1">
                {{ __('dashboard.view_all') }} →
            </a>
        </div>

        {{-- Active Outbound --}}
        <div class="kpi-card">
            <div class="kpi-label">{{ __('dashboard.active_outbound') }}</div>
            <div class="kpi-value text-kojid-green">{{ $active_outbound }}</div>
            <a href="{{ route('orders.outbound.index') }}" class="text-xs text-kojid-green hover:underline mt-1">
                {{ __('dashboard.view_all') }} →
            </a>
        </div>

        {{-- Today's Margin --}}
        <div class="kpi-card">
            <div class="kpi-label">{{ __('dashboard.today_margin') }}</div>
            <div class="kpi-value">
                <x-money :amount="$today_margin->getAmount()->__toString()" :colored="true"/>
            </div>
            <div class="text-xs text-slate-400 mt-1">{{ now()->setTimezone('Asia/Kuala_Lumpur')->format('d M Y') }}</div>
        </div>
    </div>

    {{-- Ghost Orders Alert --}}
    @if($ghost_orders->count() > 0)
    <div class="card border-kojid-amber/40">
        <div class="card-header bg-amber-50">
            <div class="flex items-center gap-2">
                <x-icon name="exclamation-triangle" class="w-5 h-5 text-kojid-amber"/>
                <h2 class="font-semibold text-amber-900">
                    {{ __('dashboard.ghost_orders_warning', ['count' => $ghost_orders->count()]) }}
                </h2>
            </div>
        </div>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>{{ __('orders.order_no') }}</th>
                        <th>{{ __('orders.entity') }}</th>
                        <th>{{ __('orders.sla_deadline') }}</th>
                        <th>{{ __('orders.status') }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($ghost_orders as $order)
                        <tr>
                            <td class="font-mono text-sm font-semibold text-slate-900">
                                {{ $order->order_number }}
                            </td>
                            <td>{{ $order->entity?->name ?? '&mdash;' }}</td>
                            <td class="font-mono text-xs text-amber-700 font-semibold">
                                {{ $order->sla_deadline_at ? $order->sla_deadline_at->setTimezone('Asia/Kuala_Lumpur')->format('d/m/Y H:i') : '&mdash;' }}
                            </td>
                            <td>
                                <span class="badge badge-amber">{{ $order->status }}</span>
                            </td>
                            <td>
                                <a href="{{ route($order->direction === 'INBOUND' ? 'orders.inbound.show' : 'orders.outbound.show', $order) }}"
                                   class="btn-secondary btn-sm">
                                    {{ __('dashboard.view_order') }}
                                </a>
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
    @endif

    {{-- Recent Orders Table --}}
    <div class="card">
        <div class="card-header">
            <h2 class="font-semibold text-slate-800">{{ __('dashboard.recent_orders') }}</h2>
        </div>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>{{ __('orders.order_no') }}</th>
                        <th>{{ __('orders.direction') }}</th>
                        <th>{{ __('orders.commodity') }}</th>
                        <th>{{ __('orders.status') }}</th>
                        <th>{{ __('orders.created_at') }}</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($recent_orders as $order)
                        @php
                            $orderUrl = route($order->direction === 'INBOUND' ? 'orders.inbound.show' : 'orders.outbound.show', $order);
                        @endphp
                        <tr onclick="window.location.href='{{ $orderUrl }}'" class="hover:bg-emerald-50/60 transition-colors cursor-pointer group">
                            <td class="font-mono text-sm font-black text-emerald-700 group-hover:underline">
                                <a href="{{ $orderUrl }}" onclick="event.stopPropagation();" class="text-emerald-700 hover:text-emerald-900">
                                    {{ $order->order_number }}
                                </a>
                            </td>
                            <td>
                                <span class="badge {{ $order->direction === 'INBOUND' ? 'badge-blue' : 'badge-green' }}">
                                    {{ $order->direction }}
                                </span>
                            </td>
                            <td class="capitalize text-slate-700 font-semibold">{{ str_replace('_', ' ', strtolower($order->commodity_type ?? 'Komoditi')) }}</td>
                            <td>
                                <span class="badge badge-slate font-bold">{{ $order->status }}</span>
                            </td>
                            <td class="text-xs text-slate-500 font-mono">
                                {{ $order->created_at ? $order->created_at->setTimezone('Asia/Kuala_Lumpur')->format('d M Y H:i') : '-' }}
                            </td>
                            <td class="text-right">
                                <a href="{{ $orderUrl }}"
                                   onclick="event.stopPropagation();"
                                   style="background-color: #047857; color: #ffffff; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-size: 11px; text-decoration: none; border: 1px solid #065f46;"
                                   class="btn-primary btn-sm inline-block shadow-sm">
                                    {{ __('dashboard.view_order') }} →
                                </a>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="6" class="text-center py-8 text-slate-400">
                                {{ __('dashboard.no_recent_orders') }}
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

</div>
@endsection
