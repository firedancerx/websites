@extends('layouts.app')
@section('title', 'Senarai Kuota')

@section('content')
<div class="space-y-4">
    <div class="page-header">
        <div>
            <h1 class="page-title">Tuntutan Kuota Anda</h1>
            <p class="page-subtitle">Senarai status pengesahan kuota semasa syarikat anda</p>
        </div>
        <div class="flex items-center gap-2">
            <a href="{{ route('quota.balance') }}" class="btn-secondary btn-sm">
                Baki Kuota Aktif
            </a>
            @if(auth()->user()->isSuperAdmin() || (auth()->user()->tenant && auth()->user()->tenant->parent_id === null))
            <a href="{{ route('quota.queue') }}" class="btn-secondary btn-sm">
                Queue Pengesahan Subtenant
            </a>
            @endif
            <a href="{{ route('quota.create') }}" class="btn-primary btn-sm">
                Isytihar Kuota Baharu
            </a>
        </div>
    </div>

    <div class="card">
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Jenis Komoditi</th>
                        <th>Kuantiti Dituntut</th>
                        <th>Status</th>
                        <th>Fail Bukti</th>
                        <th>Pengesah</th>
                        <th>Tarikh Dihantar</th>
                        <th>Tarikh Disahkan</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($claims as $claim)
                    <tr>
                        <td class="font-semibold text-slate-800">
                            @if($claim->commodity_type === 'rice')
                                Beras (Rice)
                            @elseif($claim->commodity_type === 'sugar')
                                Gula (Sugar)
                            @elseif($claim->commodity_type === 'cooking_oil')
                                Minyak Masak (Cooking Oil)
                            @else
                                {{ $claim->commodity_type }}
                            @endif
                        </td>
                        <td class="font-mono text-sm text-slate-600">{{ number_format($claim->claimed_qty, 2) }} MT</td>
                        <td>
                            @if($claim->status === 'provisional')
                                <span class="badge badge-amber">Provisional (Sementara)</span>
                            @elseif($claim->status === 'confirmed')
                                <span class="badge badge-green">Confirmed (Disahkan)</span>
                            @elseif($claim->status === 'rejected')
                                <span class="badge badge-red">Rejected (Ditolak)</span>
                            @endif
                        </td>
                        <td>
                            @if($claim->evidence_path)
                                <a href="{{ asset('storage/' . $claim->evidence_path) }}" target="_blank" class="text-kojid-green font-medium hover:underline inline-flex items-center gap-1">
                                    <x-icon name="document-arrow-down" class="w-4 h-4"/>
                                    Papar Fail
                                </a>
                            @else
                                -
                            @endif
                        </td>
                        <td class="text-sm text-slate-600">
                            {{ $claim->verifier ? $claim->verifier->name : '-' }}
                            @if($claim->reviewer_notes)
                                <span class="block text-xs text-slate-400 font-sans mt-0.5">{{ $claim->reviewer_notes }}</span>
                            @endif
                        </td>
                        <td class="text-sm text-slate-500">{{ $claim->created_at->format('d M Y, H:i') }}</td>
                        <td class="text-sm text-slate-500">{{ $claim->verified_at ? $claim->verified_at->format('d M Y, H:i') : '-' }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="7" class="text-center py-12 text-slate-400">Tiada rekod tuntutan kuota</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</div>
@endsection
