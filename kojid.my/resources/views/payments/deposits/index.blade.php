@extends('layouts.app')

@section('title', __('payments.deposits'))

@section('content')
<div class="space-y-6">
    <div class="page-header flex-wrap gap-3">
        <div>
            <h1 class="page-title">{{ __('payments.deposits') }}</h1>
            <p class="page-subtitle">{{ __('payments.deposits_subtitle') ?? 'Urus deposit escrow, kelulusan pemulangan (refund), dan pengiraan agihan (4-party settlement)' }}</p>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" x-data="{ selectedDeposit: null }">
        {{-- Deposits roster list --}}
        <div class="lg:col-span-2 space-y-4">
            <div class="card">
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>No. Deposit</th>
                                <th>Pesanan</th>
                                <th>Entiti</th>
                                <th>Baki Deposit Escrow</th>
                                <th>Status</th>
                                <th>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($deposits as $deposit)
                            @php
                                $currency = $deposit->order ? $deposit->order->currency : 'MYR';
                                $orderUrl = $deposit->order ? ($deposit->order->type === 'inbound' ? route('orders.inbound.show', $deposit->order) : route('orders.outbound.show', $deposit->order)) : '#';
                                $displayAmount = $deposit->status === 'REFUNDED' ? 'RM 0.00' : \App\Helpers\KojidHelper::formatCurrency($deposit->amount, $currency);
                            @endphp
                            <tr class="cursor-pointer hover:bg-slate-50 transition-colors"
                                @click="selectedDeposit = {
                                    id: '{{ $deposit->id }}',
                                    ref: 'DEP-{{ str_pad($deposit->id, 6, '0', STR_PAD_LEFT) }}',
                                    orderNum: '{{ $deposit->order->order_number ?? '—' }}',
                                    orderUrl: '{{ $orderUrl }}',
                                    entity: '{{ $deposit->entity->name ?? '—' }}',
                                    amountRaw: '{{ $deposit->amount }}',
                                    originalAmount: '{{ \App\Helpers\KojidHelper::formatCurrency($deposit->amount, $currency) }}',
                                    amount: '{{ $displayAmount }}',
                                    status: '{{ $deposit->status }}',
                                    date: '{{ $deposit->created_at->timezone('Asia/Kuala_Lumpur')->format('d M Y H:i') }}',
                                    refund_requested_at: '{{ $deposit->refund_requested_at ? $deposit->refund_requested_at->timezone('Asia/Kuala_Lumpur')->format('d M Y H:i') : '' }}',
                                    approved1: {{ $deposit->approved_by_tenant ? 'true' : 'false' }},
                                    approved2: {{ $deposit->approved_by_finance ? 'true' : 'false' }},
                                    canApprove1: {{ auth()->user()->can('approveRefund', $deposit) ? 'true' : 'false' }},
                                    canApprove2: {{ auth()->user()->can('financeApproveRefund', $deposit) ? 'true' : 'false' }}
                                }">
                                <td class="font-mono text-sm text-kojid-green font-semibold">
                                    DEP-{{ str_pad($deposit->id, 6, '0', STR_PAD_LEFT) }}
                                </td>
                                <td>
                                    @if($deposit->order)
                                        <span class="font-mono text-slate-700 font-medium">{{ $deposit->order->order_number }}</span>
                                    @else
                                        —
                                    @endif
                                </td>
                                <td>{{ $deposit->entity->name ?? '—' }}</td>
                                <td class="font-mono font-semibold">
                                    @if($deposit->status === 'REFUNDED')
                                        <span class="text-slate-400 line-through text-xs mr-1">
                                            {{ \App\Helpers\KojidHelper::formatCurrency($deposit->amount, $currency) }}
                                        </span>
                                        <span class="font-bold text-emerald-800">RM 0.00</span>
                                    @else
                                        {{ \App\Helpers\KojidHelper::formatCurrency($deposit->amount, $currency) }}
                                    @endif
                                </td>
                                <td>
                                    <x-state-badge :status="$deposit->status" />
                                </td>
                                <td>
                                    <button class="btn-secondary btn-sm" type="button">Pergerakan & Urus</button>
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="6" class="text-center text-slate-400 py-8">Tiada deposit.</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
                <div class="px-4 py-3">
                    {{ $deposits->links() }}
                </div>
            </div>
        </div>

        {{-- Settlement cockpit details & movements audit trail --}}
        <div class="card h-fit" x-show="selectedDeposit" x-cloak>
            <div class="card-header bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h2 class="font-semibold text-slate-800" x-text="selectedDeposit?.ref"></h2>
                <button @click="selectedDeposit = null" class="text-slate-400 hover:text-slate-600">
                    <x-icon name="x-mark" class="w-5 h-5"/>
                </button>
            </div>
            <div class="card-body space-y-5">
                <div class="space-y-2">
                    <div class="flex justify-between text-xs border-b border-slate-100 pb-1.5">
                        <span class="text-slate-500">Organisasi Pemilik:</span>
                        <span class="font-bold text-slate-800" x-text="selectedDeposit?.entity"></span>
                    </div>
                    <div class="flex justify-between text-xs border-b border-slate-100 pb-1.5">
                        <span class="text-slate-500">Rujukan Pesanan:</span>
                        <a :href="selectedDeposit?.orderUrl" class="font-mono font-bold text-kojid-green hover:underline" x-text="selectedDeposit?.orderNum"></a>
                    </div>
                    <div class="flex justify-between text-xs border-b border-slate-100 pb-1.5">
                        <span class="text-slate-500">Baki Deposit Escrow Semasa:</span>
                        <span class="font-mono font-bold text-slate-800" x-text="selectedDeposit?.amount"></span>
                    </div>
                    <div class="flex justify-between text-xs border-b border-slate-100 pb-1.5">
                        <span class="text-slate-500">Tarikh Penerimaan Awal:</span>
                        <span class="text-slate-600" x-text="selectedDeposit?.date"></span>
                    </div>
                </div>

                {{-- Deposit Movements Listing --}}
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <h3 class="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                        <span>📊 Pergerakan Akaun Deposit</span>
                        <span class="text-[10px] text-slate-500 font-mono" x-text="selectedDeposit?.status === 'REFUNDED' ? 'Baki Aktif: RM 0.00' : 'Baki Escrow Disimpan'"></span>
                    </h3>
                    
                    <div class="space-y-2 text-xs font-mono">
                        <div class="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                            <div>
                                <span class="font-bold text-slate-800 block">Penerimaan Deposit Awal</span>
                                <span class="text-[10px] text-slate-400" x-text="selectedDeposit?.date"></span>
                            </div>
                            <span class="text-emerald-700 font-bold" x-text="'+ ' + selectedDeposit?.originalAmount"></span>
                        </div>

                        <template x-if="selectedDeposit?.status === 'REFUNDED'">
                            <div class="flex justify-between items-center bg-red-50 p-2 rounded border border-red-200">
                                <div>
                                    <span class="font-bold text-red-800 block">Pemulangan Penuh (Refund Paid)</span>
                                    <span class="text-[10px] text-red-500" x-text="selectedDeposit?.refund_requested_at || 'Disahkan Payout'"></span>
                                </div>
                                <span class="text-red-700 font-bold" x-text="'- ' + selectedDeposit?.originalAmount"></span>
                            </div>
                        </template>

                        <div class="flex justify-between items-center p-2 rounded bg-slate-100 font-bold border border-slate-300">
                            <span class="text-slate-800">Baki Deposit Akhir:</span>
                            <span x-text="selectedDeposit?.amount" 
                                  :class="selectedDeposit?.status === 'REFUNDED' ? 'text-slate-500 font-mono' : 'text-emerald-800 font-mono'"></span>
                        </div>
                    </div>
                </div>

                {{-- Refund Dual Approval Flow status --}}
                <div class="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Dual-Approval Payout Verification</h3>
                    
                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                             :class="selectedDeposit?.approved1 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'">
                            ✓
                        </div>
                        <div class="text-xs">
                            <span class="font-semibold block text-slate-800">Kelulusan Tenant Admin</span>
                            <span class="text-slate-500" x-text="selectedDeposit?.approved1 ? 'Telah diluluskan' : 'Menunggu kelulusan step 1'"></span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <div class="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                             :class="selectedDeposit?.approved2 ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'">
                            ✓
                        </div>
                        <div class="text-xs">
                            <span class="font-semibold block text-slate-800">Kelulusan Pegawai Kewangan (Finance)</span>
                            <span class="text-slate-500" x-text="selectedDeposit?.approved2 ? 'Telah diluluskan' : 'Menunggu kelulusan step 2'"></span>
                        </div>
                    </div>

                    {{-- Form: Tenant Admin approval --}}
                    <div x-show="!selectedDeposit?.approved1 && selectedDeposit?.canApprove1" class="pt-3 border-t border-slate-200">
                        <form method="POST" :action="'/deposits/' + selectedDeposit?.id + '/approve-refund'" class="space-y-3">
                            @csrf
                            <div>
                                <label class="text-[11px] font-semibold text-slate-600 block mb-1">Sebab Payout / Refund *</label>
                                <input type="text" name="reason" class="form-input text-xs" required placeholder="Masukkan sebab minima 10 abjad">
                            </div>
                            <button type="submit" class="btn-primary btn-sm w-full justify-center">
                                Luluskan Step 1 (Tenant Admin)
                            </button>
                        </form>
                    </div>

                    {{-- Form: Finance Officer approval --}}
                    <div x-show="selectedDeposit?.approved1 && !selectedDeposit?.approved2 && selectedDeposit?.canApprove2" class="pt-3 border-t border-slate-200">
                        <form method="POST" :action="'/deposits/' + selectedDeposit?.id + '/finance-approve-refund'">
                            @csrf
                            <button type="submit" class="btn-warning btn-sm w-full justify-center">
                                Sahkan Step 2 & Proses Payout
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
