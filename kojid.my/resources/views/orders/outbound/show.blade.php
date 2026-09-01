@extends('layouts.app')
@section('title', $order->order_number)

@section('content')
<div class="space-y-6" x-data="orderStatePoller('{{ $order->id }}', '{{ $order->status }}')">
    <div class="page-header flex-wrap gap-3">
        <div>
            <div class="flex items-center gap-3 flex-wrap">
                <h1 class="page-title font-mono">{{ $order->order_number }}</h1>
                <x-state-badge :status="$order->status"/>
                @if($order->settlement_type)
                    <span class="badge badge-slate uppercase">{{ str_replace('_','-',$order->settlement_type) }}</span>
                @endif
                <span class="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold uppercase">Outbound</span>
            </div>
            <p class="page-subtitle">
                {{ __('orders.outbound_to') }}: <strong>{{ $order->entity->name }}</strong>
                @if($order->quotaHolder)
                    &mdash; {{ __('orders.quota_holder') }}: <strong>{{ $order->quotaHolder->name }}</strong>
                @endif
            </p>
        </div>
        <div class="flex items-center gap-2">
            <x-guillotina-timer :order="$order"/>
            <a href="{{ route('orders.outbound.index') }}" class="btn-secondary btn-sm">← {{ __('app.back') }}</a>
        </div>
    </div>

    {{-- SLA Countdown Timer Progress Bar --}}
    @if($order->sla_deadline_at)
    @php
        $timeLeft = now()->diffInSeconds($order->sla_deadline_at, false);
        $totalSla = $order->created_at->diffInSeconds($order->sla_deadline_at);
        $pct = $totalSla > 0 ? max(0, min(100, ($timeLeft / $totalSla) * 100)) : 0;
        
        $barColor = 'bg-kojid-green';
        if ($timeLeft < 14400) { $barColor = 'bg-kojid-amber'; }
        if ($timeLeft <= 0) { $barColor = 'bg-kojid-red'; }
    @endphp
    <div class="card p-4">
        <div class="flex justify-between items-center text-xs mb-1 font-semibold text-slate-500">
            <span>SLA Penghantaran (Delivery SLA Timer)</span>
            <span class="font-mono font-semibold">
                @if($timeLeft > 0)
                    Tinggal {{ gmdate('H:i:s', $timeLeft) }} ({{ number_format($pct, 1) }}%)
                @else
                    <span class="text-kojid-red animate-pulse">BREACHED / GHOST ORDER</span>
                @endif
            </span>
        </div>
        <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
            <div class="{{ $barColor }} h-2 transition-all duration-500" style="width: {{ $pct }}%"></div>
        </div>
    </div>
    @endif

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2 space-y-5">

            {{-- Items --}}
            <div class="card">
                <div class="card-header">
                    <h2 class="font-semibold text-slate-800">{{ __('orders.line_items') }}</h2>
                </div>
                <div class="table-wrap rounded-none border-0">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>{{ __('orders.product') }}</th>
                                <th>{{ __('orders.qty') }}</th>
                                <th>Harga Jualan</th>
                                <th>Cukai (Tax)</th>
                                <th>Caj Logistik</th>
                                <th>{{ __('orders.line_total') }}</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach($order->items as $item)
                            <tr>
                                <td>
                                    <div class="font-medium">{{ $item->product_snapshot_name }}</div>
                                    <div class="text-xs font-mono text-slate-400">{{ $item->product_snapshot_sku }}</div>

                                    {{-- FIFO Lot Freshness details --}}
                                    @if($item->batch_number)
                                    <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">Lot: {{ $item->batch_number }}</span>
                                        @if($item->expiry_date)
                                            @php
                                                $daysToExpiry = now()->diffInDays(\Carbon\Carbon::parse($item->expiry_date), false);
                                                $dofBadge = 'badge-green';
                                                if ($daysToExpiry < 7) { $dofBadge = 'badge-amber'; }
                                                if ($daysToExpiry <= 0) { $dofBadge = 'badge-red'; }
                                            @endphp
                                            <span class="badge {{ $dofBadge }} text-[10px]">DoF: {{ $daysToExpiry }} hari tinggal</span>
                                        @endif
                                    </div>
                                    @endif
                                </td>
                                <td class="font-mono">{{ number_format($item->quantity, 3) }} {{ $item->product_snapshot_unit }}</td>
                                <td>{{ \App\Helpers\KojidHelper::formatCurrency($item->unit_price, $order->currency) }}</td>
                                <td class="text-slate-500 text-xs">
                                    {{ $item->tax_rate > 0 ? $item->tax_rate . '%' : '0%' }}
                                    @if($item->tax_amount > 0)
                                        <span class="block font-mono mt-0.5">{{ \App\Helpers\KojidHelper::formatCurrency($item->tax_amount, $order->currency) }}</span>
                                    @endif
                                </td>
                                <td>{{ \App\Helpers\KojidHelper::formatCurrency($item->logistics_cost, $order->currency) }}</td>
                                <td class="font-semibold">{{ \App\Helpers\KojidHelper::formatCurrency($item->line_total, $order->currency) }}</td>
                            </tr>
                            @endforeach
                        </tbody>
                        <tfoot>
                            <tr class="bg-slate-50 font-semibold text-slate-700">
                                <td colspan="5" class="px-4 py-3 text-right">Jumlah Cukai</td>
                                <td class="px-4 py-3 font-mono">{{ \App\Helpers\KojidHelper::formatCurrency($order->items->sum('tax_amount'), $order->currency) }}</td>
                            </tr>
                            <tr class="bg-slate-100 font-bold text-slate-800">
                                <td colspan="5" class="px-4 py-3 text-right">{{ __('orders.total') }}</td>
                                <td class="px-4 py-3 font-mono">{{ \App\Helpers\KojidHelper::formatCurrency($order->total_amount, $order->currency) }}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {{-- Double-Entry Ledger Impact --}}
            @php
                $ledgerEntries = \App\Models\LedgerEntry::where('order_id', $order->id)->get();
            @endphp
            <div class="card">
                <div class="card-header">
                    <h2 class="font-semibold text-slate-800">Kesan Jurnal Lejer (Double-Entry Ledger Impact)</h2>
                    <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">Kekal / Immutable</span>
                </div>
                <div class="table-wrap rounded-none border-0">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Kod Akaun</th>
                                <th>Keterangan (Narrative)</th>
                                <th class="text-right">Debit (DR)</th>
                                <th class="text-right">Kredit (CR)</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($ledgerEntries as $entry)
                            <tr>
                                <td class="font-mono text-sm font-semibold text-slate-800">{{ $entry->account_code }}</td>
                                <td class="text-sm text-slate-600">
                                    {{ $entry->narrative }}
                                    <span class="block text-[10px] text-slate-400 font-mono mt-0.5">Ref: {{ $entry->transaction_ref }}</span>
                                </td>
                                <td class="text-right font-mono text-kojid-green">
                                    {{ $entry->dr_amount > 0 ? \App\Helpers\KojidHelper::formatCurrency($entry->dr_amount, $entry->currency) : '-' }}
                                </td>
                                <td class="text-right font-mono text-kojid-red">
                                    {{ $entry->cr_amount > 0 ? \App\Helpers\KojidHelper::formatCurrency($entry->cr_amount, $entry->currency) : '-' }}
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="4" class="text-center py-6 text-slate-400 text-xs">Tiada kesan jurnal lejer dicatat untuk status semasa</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            {{-- State History --}}
            <div class="card">
                <div class="card-header">
                    <h2 class="font-semibold text-slate-800">{{ __('orders.state_history') }}</h2>
                </div>
                <div class="card-body">
                    <ol class="relative border-l border-slate-200 ml-3 space-y-4">
                        @foreach($order->stateLogs as $log)
                        <li class="ml-5">
                            <div class="absolute -left-1.5 w-3 h-3 rounded-full
                                {{ $log->to_state === 'SETTLED' ? 'bg-kojid-green' : ($log->to_state === 'CANCELLED_FORFEITED' ? 'bg-guillotina' : 'bg-slate-300') }}">
                            </div>
                            <div class="flex justify-between flex-wrap gap-1">
                                <div>
                                    <span class="text-sm font-semibold text-slate-800">{{ $log->to_state }}</span>
                                    @if($log->notes)
                                        <p class="text-xs text-slate-500 mt-0.5">{{ $log->notes }}</p>
                                    @endif
                                </div>
                                <div class="text-right text-xs text-slate-400">
                                    {{ $log->triggered_at->setTimezone('Asia/Kuala_Lumpur')->format('d M Y H:i') }}
                                    &mdash; {{ $log->triggered_by_label }}
                                </div>
                            </div>
                        </li>
                        @endforeach
                    </ol>
                </div>
            </div>
        </div>

        {{-- Sidebar --}}
        <div class="space-y-5">
            @if($allowedTransitions && !$order->isInTerminalState())
            @can('update', $order)
            <div class="card border-kojid-green/20">
                <div class="card-header bg-green-50">
                    <h2 class="font-semibold text-green-900">{{ __('orders.actions') }}</h2>
                </div>
                <div class="card-body space-y-3">
                    @php
                    $actionLabels = [
                        'DEPOSIT_CONFIRMED'  => ['action'=>'confirm_deposit','label'=>__('orders.actions.confirm_deposit'),'class'=>'btn-warning'],
                        'PENDING_DISPATCH'   => ['action'=>'dispatch','label'=>__('orders.actions.dispatch'),'class'=>'btn-primary'],
                        'IN_TRANSIT'         => ['action'=>'in_transit','label'=>__('orders.actions.in_transit'),'class'=>'btn-primary'],
                        'DELIVERED'          => ['action'=>'delivered','label'=>__('orders.actions.delivered'),'class'=>'btn-primary'],
                        'SETTLED'            => ['action'=>'settle','label'=>__('orders.actions.settle'),'class'=>'btn-primary'],
                        'DISPUTED'           => ['action'=>'dispute','label'=>__('orders.actions.dispute'),'class'=>'btn-warning'],
                        'CANCELLED_FORFEITED'=> ['action'=>'cancel','label'=>__('orders.actions.cancel'),'class'=>'btn-danger'],
                    ];
                    @endphp
                    @foreach($allowedTransitions as $toState)
                        @if(isset($actionLabels[$toState]))
                        <form method="POST" action="{{ route('orders.outbound.transition', $order) }}">
                            @csrf
                            <input type="hidden" name="action" value="{{ $actionLabels[$toState]['action'] }}">
                            <div class="mb-2">
                                <input type="text" name="notes" class="form-input text-xs"
                                       placeholder="{{ __('orders.notes_optional') }}">
                            </div>
                            <button type="submit" class="{{ $actionLabels[$toState]['class'] }} w-full justify-center">
                                {{ $actionLabels[$toState]['label'] }}
                            </button>
                        </form>
                        @endif
                    @endforeach
                </div>
            </div>
            @endcan
            @endif

            <div class="card">
                <div class="card-header"><h2 class="font-semibold text-slate-800">{{ __('orders.details') }}</h2></div>
                <div class="card-body space-y-3 text-sm">
                    <div class="flex justify-between">
                        <span class="text-slate-500">{{ __('orders.payment_terms') }}</span>
                        <span class="font-medium uppercase">{{ $order->payment_terms }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">Mata Wang (Currency)</span>
                        <span class="font-semibold uppercase">{{ $order->currency }}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-slate-500">{{ __('orders.deposit') }}</span>
                        <span>{{ \App\Helpers\KojidHelper::formatCurrency($order->deposit_amount, $order->currency) }}</span>
                    </div>
                    @if($order->settlement)
                    <div class="flex justify-between border-t border-slate-100 pt-2">
                        <span class="text-slate-500">{{ __('orders.gross_margin') }}</span>
                        <span class="font-bold text-kojid-green">{{ \App\Helpers\KojidHelper::formatCurrency($order->settlement->gross_margin, $order->currency) }}</span>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
@push('scripts')
@vite('resources/js/order-state.js')
@endpush
