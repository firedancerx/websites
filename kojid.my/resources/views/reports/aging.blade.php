@extends('layouts.app')
@section('title', 'Laporan Penuaan Hutang')

@section('content')
<div class="space-y-5">
    <div class="page-header">
        <div>
            <h1 class="page-title flex items-center gap-2">
                <x-icon name="banknotes" class="w-6 h-6 text-kojid-amber"/>
                Laporan Penuaan Hutang
            </h1>
            <p class="page-subtitle">Analisis penuaan akaun belum terima dan deposit</p>
        </div>
        <a href="{{ route('reports.aging', ['format' => 'pdf']) }}" class="btn-secondary btn-sm">
            <x-icon name="document-arrow-down" class="w-4 h-4"/> PDF
        </a>
    </div>

    {{-- Summary Buckets --}}
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        @php
            $recvCollection = collect($receivables);
            $buckets = [
                '0-30'  => $recvCollection->filter(fn($r) => ($r['days_overdue'] ?? 0) <= 30),
                '31-60' => $recvCollection->filter(fn($r) => ($r['days_overdue'] ?? 0) > 30 && ($r['days_overdue'] ?? 0) <= 60),
                '61-90' => $recvCollection->filter(fn($r) => ($r['days_overdue'] ?? 0) > 60 && ($r['days_overdue'] ?? 0) <= 90),
                '90+'   => $recvCollection->filter(fn($r) => ($r['days_overdue'] ?? 0) > 90),
            ];
            $bucketColors = [
                '0-30'  => 'text-kojid-green',
                '31-60' => 'text-kojid-amber',
                '61-90' => 'text-orange-500',
                '90+'   => 'text-kojid-red',
            ];
        @endphp
        @foreach($buckets as $label => $items)
        <div class="card">
            <div class="card-body text-center">
                <div class="text-sm text-slate-500">{{ $label }} hari</div>
                <div class="text-2xl font-bold {{ $bucketColors[$label] }}">
                    RM {{ number_format($items->sum('amount'), 2) }}
                </div>
                <div class="text-xs text-slate-400">{{ $items->count() }} rekod</div>
            </div>
        </div>
        @endforeach
    </div>

    {{-- Receivables Table --}}
    <div class="card">
        <div class="card-header">
            <h2 class="font-semibold text-slate-800">Akaun Belum Terima</h2>
            <span class="text-sm text-slate-500">{{ $recvCollection->count() }} rekod</span>
        </div>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Entiti</th>
                        <th>No. Pesanan</th>
                        <th>Jumlah</th>
                        <th>Hari Tertunggak</th>
                        <th>Baldi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse(collect($receivables)->sortByDesc('days_overdue') as $item)
                    @php
                        $days = $item['days_overdue'] ?? 0;
                        $bucket = match(true) {
                            $days <= 30 => '0-30',
                            $days <= 60 => '31-60',
                            $days <= 90 => '61-90',
                            default => '90+',
                        };
                        $badgeClass = match($bucket) {
                            '0-30'  => 'badge-green',
                            '31-60' => 'badge-amber',
                            '61-90' => 'badge-orange',
                            '90+'   => 'badge-red',
                        };
                    @endphp
                    <tr>
                        <td class="font-semibold text-slate-800">{{ $item['entity'] ?? '—' }}</td>
                        <td>
                            <span class="font-mono text-sm text-slate-600">{{ $item['order_number'] ?? '—' }}</span>
                        </td>
                        <td class="font-mono"><x-money :amount="$item['amount'] ?? '0'"/></td>
                        <td class="font-mono text-sm">{{ $days }}</td>
                        <td><span class="badge {{ $badgeClass }}">{{ $bucket }}</span></td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="text-center py-12 text-slate-400">Tiada akaun belum terima</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>

    {{-- Deposits Section --}}
    @php $depCollection = collect($deposits); @endphp
    @if($depCollection->count())
    <div class="card">
        <div class="card-header">
            <h2 class="font-semibold text-slate-800">Deposit Tertunggak</h2>
            <span class="text-sm text-slate-500">{{ $depCollection->count() }} rekod</span>
        </div>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Entiti</th>
                        <th>No. Pesanan</th>
                        <th>Jumlah Deposit</th>
                        <th>Status</th>
                        <th>Hari Tertunggak</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($depCollection as $deposit)
                    <tr>
                        <td class="font-semibold text-slate-800">{{ $deposit['entity'] ?? '—' }}</td>
                        <td class="font-mono text-sm text-slate-600">{{ $deposit['order_number'] ?? '—' }}</td>
                        <td class="font-mono"><x-money :amount="$deposit['amount'] ?? '0'"/></td>
                        <td>
                            <span class="badge {{ ($deposit['status'] ?? '') === 'RECEIVED' ? 'badge-green' : (($deposit['status'] ?? '') === 'FORFEITED' ? 'badge-red' : 'badge-amber') }}">
                                {{ $deposit['status'] ?? '—' }}
                            </span>
                        </td>
                        <td class="font-mono text-sm">{{ $deposit['age_days'] ?? '—' }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
    </div>
    @endif
</div>
@endsection
