@extends('layouts.app')
@section('title', $entity->name)

@section('content')
<div class="space-y-6">

    {{-- Header --}}
    <div class="page-header flex-wrap gap-3">
        <div>
            <div class="flex items-center gap-3 flex-wrap">
                <h1 class="page-title">{{ $entity->name }}</h1>
                @if($entity->isVerified())
                    <span class="badge badge-green">{{ __('entities.verified') }}</span>
                @else
                    <span class="badge badge-amber">{{ __('entities.unverified') }}</span>
                @endif
                @if($entity->is_blacklisted)
                    <span class="badge badge-red">{{ __('entities.blacklisted') }}</span>
                @endif
            </div>
            <p class="page-subtitle">
                <span class="font-mono">{{ $entity->ssm_number }}</span>
                &mdash; <span class="uppercase">{{ $entity->entity_type }}</span>
            </p>
        </div>
        <div class="flex items-center gap-2">
            <a href="{{ route('entities.index') }}" class="btn-secondary btn-sm">← {{ __('app.back') }}</a>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {{-- Left column --}}
        <div class="lg:col-span-2 space-y-5">

            {{-- Active Roles --}}
            @if($entity->activeRoles->count())
            <div class="card">
                <div class="card-header">
                    <h2 class="font-semibold text-slate-800">{{ __('entities.roles') }}</h2>
                </div>
                <div class="card-body">
                    <div class="flex flex-wrap gap-2">
                        @foreach($entity->activeRoles as $role)
                            <span class="badge badge-slate uppercase">{{ $role->role }}</span>
                        @endforeach
                    </div>
                </div>
            </div>
            @endif

            {{-- Recent Orders --}}
            <div class="card">
                <div class="card-header">
                    <h2 class="font-semibold text-slate-800">Pesanan Terkini</h2>
                    <span class="text-sm text-slate-500">
                        {{ $entity->inboundOrders->count() + $entity->outboundOrders->count() }} pesanan
                    </span>
                </div>
                <div class="table-wrap rounded-none border-0">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>{{ __('orders.order_number') }}</th>
                                <th>Jenis</th>
                                <th>Status</th>
                                <th>Jumlah</th>
                                <th>Tarikh</th>
                            </tr>
                        </thead>
                        <tbody>
                            @php
                                $recentOrders = $entity->inboundOrders->map(fn($o) => $o->setAttribute('_type', 'inbound'))
                                    ->merge($entity->outboundOrders->map(fn($o) => $o->setAttribute('_type', 'outbound')))
                                    ->sortByDesc('created_at')
                                    ->take(10);
                            @endphp
                            @forelse($recentOrders as $order)
                            <tr>
                                <td>
                                    <a href="{{ $order->_type === 'inbound' ? route('orders.inbound.show', $order) : route('orders.outbound.show', $order) }}"
                                       class="font-mono font-semibold text-slate-800 hover:text-kojid-green transition-colors">
                                        {{ $order->order_number }}
                                    </a>
                                </td>
                                <td><span class="badge badge-slate text-xs uppercase">{{ $order->_type }}</span></td>
                                <td><x-state-badge :status="$order->status"/></td>
                                <td class="font-mono"><x-money :amount="$order->total_amount"/></td>
                                <td class="text-sm text-slate-500">{{ $order->created_at->setTimezone('Asia/Kuala_Lumpur')->format('d M Y') }}</td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="5" class="text-center py-8 text-slate-400">Tiada pesanan</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {{-- Right column --}}
        <div class="space-y-5">

            {{-- KYC Actions --}}
            <div class="card border-kojid-green/20">
                <div class="card-header bg-green-50">
                    <h2 class="font-semibold text-green-900">Tindakan</h2>
                </div>
                <div class="card-body space-y-3">
                    @if(!$entity->isVerified())
                        @can('approveKyc', $entity)
                        <form method="POST" action="{{ route('entities.approve-kyc', $entity) }}">
                            @csrf
                            <button type="submit" class="btn-primary w-full justify-center">
                                <x-icon name="check-badge" class="w-4 h-4"/>
                                Luluskan KYC
                            </button>
                        </form>
                        @endcan
                    @else
                        <div class="text-sm text-slate-500">
                            Disahkan oleh {{ $entity->verifiedBy?->name ?? '—' }}
                            pada {{ $entity->kyc_verified_at?->setTimezone('Asia/Kuala_Lumpur')->format('d M Y H:i') }}
                        </div>
                    @endif

                    @can('blacklist', $entity)
                    @if($entity->is_blacklisted)
                    <form method="POST" action="{{ route('entities.unblacklist', $entity) }}">
                        @csrf
                        <button type="submit" class="btn-secondary w-full justify-center">
                            Nyahsenarai Hitam
                        </button>
                    </form>
                    @else
                    <form method="POST" action="{{ route('entities.blacklist', $entity) }}">
                        @csrf
                        <button type="submit" class="btn-danger w-full justify-center"
                                onclick="return confirm('Adakah anda pasti mahu senarai hitamkan entiti ini?')">
                            <x-icon name="no-symbol" class="w-4 h-4"/>
                            Senarai Hitam
                        </button>
                    </form>
                    @endif
                    @endcan
                </div>
            </div>

            {{-- Contact Details --}}
            <div class="card">
                <div class="card-header">
                    <h2 class="font-semibold text-slate-800">Maklumat Hubungan</h2>
                </div>
                <div class="card-body space-y-3 text-sm">
                    <div class="flex justify-between">
                        <span class="text-slate-500">Telefon</span>
                        <span class="font-medium">{{ $entity->contact_phone ?? '—' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">E-mel</span>
                        <span class="font-medium">{{ $entity->contact_email ?? '—' }}</span>
                    </div>
                    @if($entity->address)
                    <div class="pt-2 border-t border-slate-100">
                        <span class="text-slate-500 block mb-1">Alamat</span>
                        <p class="text-slate-700 text-xs">{{ $entity->address }}</p>
                    </div>
                    @endif
                </div>
            </div>

            {{-- Credit & Deposits --}}
            <div class="card">
                <div class="card-header">
                    <h2 class="font-semibold text-slate-800">Kredit & Deposit</h2>
                </div>
                <div class="card-body space-y-3 text-sm">
                    <div class="flex justify-between">
                        <span class="text-slate-500">{{ __('entities.credit_terms') }}</span>
                        <span class="font-medium uppercase">{{ $entity->credit_terms ?? 'COD' }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">Had Kredit</span>
                        <span class="font-medium">
                            @if($entity->credit_limit)
                                <x-money :amount="$entity->credit_limit"/>
                            @else
                                —
                            @endif
                        </span>
                    </div>
                    @if($entity->deposits->count())
                    <div class="pt-2 border-t border-slate-100">
                        <span class="text-slate-500 block mb-1">Deposit Aktif</span>
                        @foreach($entity->deposits->take(5) as $deposit)
                        <div class="flex items-center justify-between py-1">
                            <span class="badge {{ $deposit->status === 'RECEIVED' ? 'badge-green' : ($deposit->status === 'FORFEITED' ? 'badge-red' : 'badge-amber') }} text-xs">
                                {{ $deposit->status }}
                            </span>
                            <x-money :amount="$deposit->amount"/>
                        </div>
                        @endforeach
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
