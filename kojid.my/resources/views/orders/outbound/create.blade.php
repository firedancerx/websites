@extends('layouts.app')
@section('title', 'Pesanan Keluar Baharu')

@section('content')
<div class="max-w-4xl mx-auto space-y-6">
    <div class="page-header">
        <div>
            <h1 class="page-title">Pesanan Keluar Baharu</h1>
            <p class="page-subtitle">Cipta pesanan keluar kepada pembeli</p>
        </div>
        <a href="{{ route('orders.outbound.index') }}" class="btn-secondary btn-sm">← {{ __('app.back') }}</a>
    </div>

    <form method="POST" action="{{ route('orders.outbound.store') }}" x-data="outboundOrderForm()">
        @csrf

        {{-- Buyer Selection --}}
        <div class="card">
            <div class="card-header">
                <h2 class="font-semibold text-slate-800">Maklumat Pembeli</h2>
            </div>
            <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="form-label">Pembeli *</label>
                    <select name="entity_id" class="form-select" required
                            @change="onBuyerChange($event)">
                        <option value="">-- Pilih Pembeli --</option>
                        @foreach($buyers as $buyer)
                            <option value="{{ $buyer->id }}"
                                    data-rate="{{ $buyer->deposit_rate_override ?? $buyer->tenant->getDefaultDepositRate() }}"
                                    data-terms="{{ $buyer->credit_terms }}"
                                    {{ old('entity_id') == $buyer->id ? 'selected' : '' }}>
                                {{ $buyer->name }} ({{ $buyer->ssm_number }})
                                @if(!$buyer->isVerified()) ⚠ {{ __('entities.unverified') }} @endif
                            </option>
                        @endforeach
                    </select>
                    @error('entity_id')<p class="form-error">{{ $message }}</p>@enderror
                </div>
                <div>
                    <label class="form-label">{{ __('orders.payment_terms') }}</label>
                    <select name="payment_terms" class="form-select" x-model="paymentTerms">
                        @foreach(['cod','net7','net14','net30'] as $t)
                            <option value="{{ $t }}" {{ old('payment_terms', 'cod') === $t ? 'selected' : '' }}>
                                {{ strtoupper($t) }}
                            </option>
                        @endforeach
                    </select>
                </div>
                <div class="md:col-span-2">
                    <label class="form-label">{{ __('orders.notes') }}</label>
                    <textarea name="notes" rows="2" class="form-input"
                              placeholder="{{ __('orders.notes_placeholder') }}">{{ old('notes') }}</textarea>
                </div>
            </div>
        </div>

        {{-- Line Items --}}
        <div class="card">
            <div class="card-header">
                <h2 class="font-semibold text-slate-800">{{ __('orders.line_items') }}</h2>
                <button type="button" @click="addItem()" class="btn-primary btn-sm">
                    <x-icon name="plus" class="w-4 h-4"/>
                    {{ __('orders.add_item') }}
                </button>
            </div>
            <div class="card-body space-y-3">
                <template x-for="(item, index) in items" :key="index">
                    <div class="grid grid-cols-12 gap-3 items-end p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div class="col-span-12 md:col-span-4">
                            <label class="form-label" x-text="'{{ __('orders.product') }} *'"></label>
                            <select :name="`items[${index}][product_id]`" class="form-select" required
                                    @change="onProductChange(index, $event)">
                                <option value="">{{ __('orders.select_product') }}</option>
                                @foreach($products as $p)
                                    <option value="{{ $p->id }}"
                                            data-price="{{ $p->selling_price ?? $p->cost_price ?? '0.00' }}"
                                            data-quota="{{ $p->requiresQuota() ? '1' : '0' }}">
                                        {{ $p->name }} ({{ $p->sku }})
                                    </option>
                                @endforeach
                            </select>
                        </div>
                        <div class="col-span-4 md:col-span-2">
                            <label class="form-label">{{ __('orders.qty') }} *</label>
                            <input type="number" :name="`items[${index}][quantity]`"
                                   step="0.001" min="0.001" required
                                   x-model="item.quantity"
                                   @input="recalcItem(index)"
                                   class="form-input">
                        </div>
                        <div class="col-span-4 md:col-span-2">
                            <label class="form-label">{{ __('orders.unit_price') }} *</label>
                            <input type="number" :name="`items[${index}][unit_price]`"
                                   step="0.01" min="0.01" required
                                   x-model="item.unit_price"
                                   @input="recalcItem(index)"
                                   class="form-input">
                        </div>
                        <div class="col-span-4 md:col-span-2">
                            <label class="form-label">{{ __('orders.quota_fee') }}</label>
                            <input type="number" :name="`items[${index}][quota_fee_per_unit]`"
                                   step="0.01" min="0" x-model="item.quota_fee"
                                   class="form-input">
                        </div>
                        <div class="col-span-8 md:col-span-1">
                            <label class="form-label">{{ __('orders.line_total') }}</label>
                            <div class="form-input bg-slate-100 text-right font-mono text-sm"
                                 x-text="'RM ' + parseFloat(item.line_total || 0).toFixed(2)">
                            </div>
                        </div>
                        <div class="col-span-4 md:col-span-1 flex items-end">
                            <button type="button" @click="removeItem(index)"
                                    class="btn-danger btn-icon w-full" x-show="items.length > 1">
                                <x-icon name="trash" class="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                </template>
            </div>

            {{-- Totals --}}
            <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                <div class="space-y-1 text-sm w-64">
                    <div class="flex justify-between text-slate-600">
                        <span>{{ __('orders.subtotal') }}</span>
                        <span class="font-mono" x-text="'RM ' + total.toFixed(2)">RM 0.00</span>
                    </div>
                    <div class="flex justify-between text-slate-600">
                        <span>{{ __('orders.deposit') }} (<span x-text="depositRate + '%'"></span>)</span>
                        <span class="font-mono" x-text="'RM ' + deposit.toFixed(2)">RM 0.00</span>
                    </div>
                    <div class="flex justify-between font-bold text-slate-800 text-base border-t border-slate-300 pt-1 mt-1">
                        <span>{{ __('orders.total') }}</span>
                        <span class="font-mono" x-text="'RM ' + total.toFixed(2)">RM 0.00</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-3">
            <a href="{{ route('orders.outbound.index') }}" class="btn-secondary">{{ __('app.cancel') }}</a>
            <button type="submit" class="btn-primary">
                <x-icon name="arrow-up-tray" class="w-4 h-4"/>
                {{ __('orders.create_order') }}
            </button>
        </div>
    </form>
</div>
@endsection

@push('scripts')
<script>
function outboundOrderForm() {
    return {
        items: [{ quantity: 1, unit_price: 0, quota_fee: 0, line_total: 0 }],
        depositRate: {{ old('entity_id') ? '30' : config('kojid.deposits.default_rate', 30) }},
        paymentTerms: '{{ old('payment_terms', 'cod') }}',
        get total()   { return this.items.reduce((s, i) => s + parseFloat(i.line_total || 0), 0); },
        get deposit() { return this.total * (this.depositRate / 100); },
        addItem()     { this.items.push({ quantity: 1, unit_price: 0, quota_fee: 0, line_total: 0 }); },
        removeItem(i) { if (this.items.length > 1) this.items.splice(i, 1); },
        recalcItem(i) {
            const it = this.items[i];
            it.line_total = (parseFloat(it.quantity || 0) * parseFloat(it.unit_price || 0)).toFixed(2);
        },
        onBuyerChange(e) {
            const opt = e.target.selectedOptions[0];
            if (opt) this.depositRate = parseFloat(opt.dataset.rate || 30);
        },
        onProductChange(i, e) {
            const opt = e.target.selectedOptions[0];
            if (opt && opt.dataset.price) this.items[i].unit_price = opt.dataset.price;
            this.recalcItem(i);
        },
    };
}
</script>
@endpush
