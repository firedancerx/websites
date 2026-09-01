@extends('layouts.app')
@section('title', 'Isytihar Kuota')

@section('content')
<div class="max-w-2xl mx-auto space-y-6">
    <div class="page-header">
        <div>
            <h1 class="page-title">Isytihar Kuota Baharu</h1>
            <p class="page-subtitle">Isytihar dan hantar dokumen bukti lesen kawalan komoditi.</p>
        </div>
        <a href="{{ route('quota.index') }}" class="btn-secondary btn-sm">Kembali</a>
    </div>

    <form method="POST" action="{{ route('quota.store') }}" enctype="multipart/form-data">
        @csrf

        <div class="card">
            <div class="card-header">
                <h2 class="font-semibold text-slate-800">Tuntutan Kuota (Commodity Quota Claim)</h2>
            </div>
            <div class="card-body space-y-5">
                <div>
                    <label class="form-label">Jenis Komoditi *</label>
                    <select name="commodity_type" class="form-input" required>
                        <option value="">-- Pilih Komoditi --</option>
                        <option value="rice">Beras (BERNAS Rice)</option>
                        <option value="sugar">Gula (Sugar)</option>
                        <option value="cooking_oil">Minyak Masak (Cooking Oil)</option>
                    </select>
                    @error('commodity_type')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">Kuantiti Dituntut (Metric Ton - MT) *</label>
                    <input type="number" step="0.01" name="claimed_qty" value="{{ old('claimed_qty') }}" class="form-input" required placeholder="0.00">
                    @error('claimed_qty')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">Dokumen Bukti Lesen / Permit (Evidence Upload) *</label>
                    <input type="file" name="evidence_file" class="form-input" required>
                    <p class="text-xs text-slate-500 mt-1">Format dibenarkan: PDF, PNG, JPG, JPEG (Max 5MB).</p>
                    @error('evidence_file')<p class="form-error">{{ $message }}</p>@enderror
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
            <a href="{{ route('quota.index') }}" class="btn-secondary">Batal</a>
            <button type="submit" class="btn-primary">
                Hantar Isytihar
            </button>
        </div>
    </form>
</div>
@endsection
