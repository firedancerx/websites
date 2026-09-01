@extends('layouts.app')
@section('title', __('entities.register'))

@section('content')
<div class="max-w-3xl mx-auto space-y-6">
    <div class="page-header">
        <div>
            <h1 class="page-title">{{ __('entities.register') }}</h1>
            <p class="page-subtitle">Daftar entiti baharu (pendaftaran SSM)</p>
        </div>
        <a href="{{ route('entities.index') }}" class="btn-secondary btn-sm">← {{ __('app.back') }}</a>
    </div>

    <form method="POST" action="{{ route('entities.store') }}">
        @csrf

        <div class="card">
            <div class="card-header">
                <h2 class="font-semibold text-slate-800">Maklumat Entiti</h2>
            </div>
            <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="form-label">{{ __('entities.name') }} *</label>
                    <input type="text" name="name" value="{{ old('name') }}" class="form-input" required>
                    @error('name')<p class="form-error">{{ $message }}</p>@enderror
                </div>
                <div>
                    <label class="form-label">{{ __('entities.ssm') }} *</label>
                    <input type="text" name="ssm_number" value="{{ old('ssm_number') }}" class="form-input" required
                           placeholder="e.g. 202301012345">
                    @error('ssm_number')<p class="form-error">{{ $message }}</p>@enderror
                </div>
                <div>
                    <label class="form-label">{{ __('entities.type') }} *</label>
                    <select name="entity_type" class="form-select" required>
                        <option value="">-- Pilih Jenis --</option>
                        @foreach(['supplier', 'buyer', 'quota_holder'] as $type)
                            <option value="{{ $type }}" {{ old('entity_type') === $type ? 'selected' : '' }}>
                                {{ strtoupper($type) }}
                            </option>
                        @endforeach
                    </select>
                    @error('entity_type')<p class="form-error">{{ $message }}</p>@enderror
                </div>
                <div>
                    <label class="form-label">{{ __('entities.credit_terms') }}</label>
                    <select name="credit_terms" class="form-select">
                        @foreach(['cod', 'net7', 'net14', 'net30'] as $term)
                            <option value="{{ $term }}" {{ old('credit_terms', 'cod') === $term ? 'selected' : '' }}>
                                {{ strtoupper($term) }}
                            </option>
                        @endforeach
                    </select>
                    @error('credit_terms')<p class="form-error">{{ $message }}</p>@enderror
                </div>
                <div>
                    <label class="form-label">Telefon</label>
                    <input type="tel" name="contact_phone" value="{{ old('contact_phone') }}" class="form-input" required
                           placeholder="e.g. 012-3456789">
                    @error('contact_phone')<p class="form-error">{{ $message }}</p>@enderror
                </div>
                <div>
                    <label class="form-label">E-mel</label>
                    <input type="email" name="contact_email" value="{{ old('contact_email') }}" class="form-input"
                           placeholder="e.g. admin@syarikat.com">
                    @error('contact_email')<p class="form-error">{{ $message }}</p>@enderror
                </div>
                <div class="md:col-span-2">
                    <label class="form-label">Alamat</label>
                    <textarea name="address" rows="2" class="form-input"
                              placeholder="Alamat penuh entiti">{{ old('address') }}</textarea>
                    @error('address')<p class="form-error">{{ $message }}</p>@enderror
                </div>
                <div class="md:col-span-2">
                    <label class="form-label">{{ __('orders.notes') }}</label>
                    <textarea name="notes" rows="2" class="form-input"
                              placeholder="Nota tambahan (pilihan)">{{ old('notes') }}</textarea>
                    @error('notes')<p class="form-error">{{ $message }}</p>@enderror
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-3">
            <a href="{{ route('entities.index') }}" class="btn-secondary">{{ __('app.cancel') }}</a>
            <button type="submit" class="btn-primary">
                <x-icon name="plus" class="w-4 h-4"/>
                Daftar Entiti
            </button>
        </div>
    </form>
</div>
@endsection
