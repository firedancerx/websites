@extends('layouts.app')
@section('title', 'Baki Kuota')

@section('content')
<div class="max-w-4xl mx-auto space-y-6">
    <div class="page-header">
        <div>
            <h1 class="page-title">Ringkasan Baki Kuota</h1>
            <p class="page-subtitle">Kapasiti dan penggunaan kuota semasa syarikat anda</p>
        </div>
        <a href="{{ route('quota.index') }}" class="btn-secondary btn-sm">Kembali</a>
    </div>

    {{-- Quota Balance Cards grid --}}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        @foreach(['rice' => 'Beras (Rice)', 'sugar' => 'Gula (Sugar)', 'cooking_oil' => 'Minyak Masak (Cooking Oil)'] as $key => $name)
        @php
            $balance = $quotaBalances[$key] ?? 0.00;
        @endphp
        <div class="card p-5 space-y-2 border-t-4 {{ $balance > 0 ? 'border-kojid-green' : 'border-slate-300' }}">
            <div class="text-xs font-semibold text-slate-400 uppercase tracking-wider">{{ $name }}</div>
            <div class="text-3xl font-mono font-bold text-slate-800">{{ number_format($balance, 2) }} <span class="text-sm font-sans font-medium text-slate-500">MT</span></div>
            <div class="text-xs text-slate-500">Jumlah kuota yang disahkan aktif.</div>
        </div>
        @endforeach
    </div>

    <div class="card">
        <div class="card-header border-b border-slate-100">
            <h2 class="font-semibold text-slate-800">Nota Pentadbiran Kuota</h2>
        </div>
        <div class="card-body text-slate-600 space-y-2 text-sm">
            <p>1. Kuota disahkan (Confirmed) sahaja yang dibenarkan untuk digunakan dalam transaksi jualan (Leg 2 Outbound Orders).</p>
            <p>2. Mana-mana komoditi terkawal bernilai melebihi had ambang KYC/KYB yang ditetapkan oleh platform akan memerlukan pengesahan tambahan.</p>
            <p>3. Subtenant boleh mengisytiharkan tuntutan kuota baharu tetapi mestilah disahkan oleh parent tenant yang berada di atas dalam rantaian.</p>
        </div>
    </div>
</div>
@endsection
