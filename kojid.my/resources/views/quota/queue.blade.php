@extends('layouts.app')
@section('title', 'Queue Pengesahan Kuota')

@section('content')
<div class="space-y-4">
    <div class="page-header">
        <div>
            <h1 class="page-title">Queue Pengesahan Kuota Subtenant</h1>
            <p class="page-subtitle">Sahkan tuntutan kuota sementara daripada subtenant di bawah kawalan anda.</p>
        </div>
        <a href="{{ route('quota.index') }}" class="btn-secondary btn-sm">Kembali</a>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {{-- Queue List --}}
        <div class="lg:col-span-2 space-y-4">
            <div class="card">
                <div class="card-header">
                    <h2 class="font-semibold text-slate-800">Menunggu Kelulusan (Pending Approval)</h2>
                </div>
                <div class="table-wrap">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Subtenant</th>
                                <th>Komoditi</th>
                                <th>Kuantiti</th>
                                <th>Fail Dokumen</th>
                                <th>Tindakan</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($claims as $claim)
                            <tr>
                                <td>
                                    <div class="font-semibold text-slate-800">{{ $claim->tenant->name }}</div>
                                </td>
                                <td>
                                    <span class="capitalize font-medium">{{ $claim->commodity_type }}</span>
                                </td>
                                <td class="font-mono text-sm text-slate-600">{{ number_format($claim->claimed_qty, 2) }} MT</td>
                                <td>
                                    @if($claim->evidence_path)
                                        <a href="{{ asset('storage/' . $claim->evidence_path) }}" target="_blank" class="text-kojid-green font-medium hover:underline inline-flex items-center gap-1">
                                            <x-icon name="document-arrow-down" class="w-4 h-4"/>
                                            Fail Bukti
                                        </a>
                                    @else
                                        -
                                    @endif
                                </td>
                                <td>
                                    <button type="button" 
                                            @click="$dispatch('select-claim', { 
                                                id: {{ $claim->id }}, 
                                                tenant: '{{ $claim->tenant->name }}',
                                                commodity: '{{ $claim->commodity_type }}',
                                                qty: '{{ number_format($claim->claimed_qty, 2) }}',
                                                file: '{{ asset('storage/' . $claim->evidence_path) }}'
                                            })" 
                                            class="btn-primary btn-sm">
                                        Periksa
                                    </button>
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="5" class="text-center py-12 text-slate-400">Tiada tuntutan kuota subtenant yang tertunggak</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {{-- Verification Review Panel --}}
        <div class="card h-fit" x-data="{ claim: null }" @select-claim.window="claim = $event.detail">
            <div class="card-header bg-slate-50 border-b border-slate-200">
                <h2 class="font-semibold text-slate-800">Panel Audit Kelulusan</h2>
            </div>
            
            {{-- Default view if no claim selected --}}
            <div class="card-body py-16 text-center text-slate-400" x-show="!claim">
                <x-icon name="document-text" class="w-12 h-12 mx-auto mb-2 text-slate-300"/>
                <p class="text-sm">Pilih tuntutan kuota daripada senarai sebelah untuk memulakan audit.</p>
            </div>

            {{-- Interactive verification form --}}
            <div class="card-body space-y-4" x-show="claim" x-cloak>
                <div class="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-500">Subtenant:</span>
                        <span class="font-bold text-slate-800" x-text="claim?.tenant"></span>
                    </div>
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-500">Komoditi:</span>
                        <span class="font-medium text-slate-800 capitalize" x-text="claim?.commodity"></span>
                    </div>
                    <div class="flex justify-between text-xs">
                        <span class="text-slate-500">Kuantiti:</span>
                        <span class="font-mono font-semibold text-slate-800" x-text="claim?.qty + ' MT'"></span>
                    </div>
                </div>

                {{-- Split pane inline preview frame --}}
                <div class="border border-slate-200 rounded-lg overflow-hidden h-48 bg-slate-100">
                    <iframe :src="claim?.file" class="w-full h-full" frameborder="0"></iframe>
                </div>

                <form method="POST" :action="'/quota/' + claim?.id + '/verify'" class="space-y-4">
                    @csrf
                    <div>
                        <label class="form-label">Nota Audit (Sebab Ditolak/Catatan)</label>
                        <textarea name="reviewer_notes" rows="3" class="form-input" placeholder="Masukkan ulasan atau sebab penolakan di sini..."></textarea>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <button type="submit" name="action" value="reject" class="btn-danger w-full justify-center">
                            Tolak Tuntutan
                        </button>
                        <button type="submit" name="action" value="approve" class="btn-primary w-full justify-center">
                            Sahkan Kuota
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>
@endsection
