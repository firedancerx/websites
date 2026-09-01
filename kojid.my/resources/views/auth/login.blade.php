{{-- resources/views/auth/login.blade.php --}}
@extends('layouts.guest')
@section('title', __('auth.login'))
@section('card-title', __('auth.welcome_back'))

@section('content')
<form method="POST" action="{{ route('login.submit') }}" class="space-y-5">
    @csrf

    <div>
        <label for="email" class="form-label">{{ __('auth.email') }}</label>
        <input id="email" name="email" type="email" autocomplete="email" required
               value="{{ old('email') }}"
               class="form-input @error('email') border-red-400 @enderror"
               placeholder="nama@syarikat.com.my">
        @error('email')
            <p class="form-error">{{ $message }}</p>
        @enderror
    </div>

    <div>
        <label for="password" class="form-label">{{ __('auth.password') }}</label>
        <input id="password" name="password" type="password" autocomplete="current-password" required
               class="form-input @error('password') border-red-400 @enderror"
               placeholder="••••••••">
        @error('password')
            <p class="form-error">{{ $message }}</p>
        @enderror
    </div>

    <div class="flex items-center justify-between">
        <label class="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
            <input type="checkbox" name="remember" class="rounded border-slate-300 text-kojid-green
                   focus:ring-kojid-green">
            {{ __('auth.remember_me') }}
        </label>
    </div>

    <button type="submit" class="btn-primary w-full justify-center py-2.5">
        <x-icon name="arrow-right-on-rectangle" class="w-4 h-4"/>
        {{ __('auth.login') }}
    </button>
</form>

<div class="mt-4 text-center text-xs text-slate-500">
    KOJID v{{ config('app.version', '1.0') }} &mdash; {{ __('auth.session_notice', ['minutes' => config('session.lifetime', 30)]) }}
</div>
@endsection
