@extends('layouts.app')
@section('title', app()->getLocale() === 'ms' ? 'Profil & Hierarki Tenant' : 'Tenant Profile & Hierarchy')

@section('content')
@php
    $isMs = app()->getLocale() === 'ms';
    $isImpersonating = $isImpersonating ?? \App\Services\TenantContextService::isImpersonating();
    $isSuperAdmin = !$isImpersonating && $user && (strtolower(trim($user->email)) === 'superadmin@kojid.com.my' || $user->isSuperAdmin());
    
    $superAdminUser = \App\Models\User::where('email', 'superadmin@kojid.com.my')->first();
    $superAdminName = $superAdminUser ? $superAdminUser->name : 'KOJID Platform Root Super Admin';
@endphp

<div class="max-w-4xl mx-auto space-y-6">
    
    {{-- Header --}}
    <div style="background-color: #ffffff; border: 1px solid #cbd5e1; padding: 24px; border-radius: 12px;" class="shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
            <div style="background-color: {{ $isImpersonating ? '#d97706' : '#047857' }}; color: #ffffff; width: 56px; height: 56px; border-radius: 14px;" class="font-black text-xl flex items-center justify-center shadow">
                {{ strtoupper(substr($tenant ? $tenant->name : $user->name, 0, 2)) }}
            </div>
            <div>
                <h1 style="color: #0f172a; font-weight: 900; font-size: 22px;" class="tracking-tight">
                    {{ $isImpersonating && $tenant ? $tenant->name : $user->name }}
                </h1>
                <div class="flex items-center gap-2 mt-1">
                    <span style="color: #475569; font-family: monospace; font-size: 12px; font-weight: 700;">
                        {{ $isImpersonating ? ('SSM: ' . ($tenant->ssm_number ?? '-')) : $user->email }}
                    </span>
                    <span style="background-color: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; padding: 2px 8px; border-radius: 9999px; font-weight: 900; font-size: 10px; text-transform: uppercase;">
                        {{ str_replace('_', ' ', $role) }}
                    </span>
                    @if($isImpersonating)
                        <span style="background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 9999px; font-weight: 900; font-size: 10px; text-transform: uppercase;">
                            IMPERSONATING
                        </span>
                    @endif
                </div>
            </div>
        </div>

        <div class="flex items-center gap-2">
            @if($isImpersonating)
                <form method="POST" action="{{ route('admin.tenants.exit-impersonate') }}" class="m-0">
                    @csrf
                    <button type="submit" 
                            style="background-color: #451a03; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; border: 1px solid #78350f; cursor: pointer;">
                        ← {{ $isMs ? 'Kembali sebagai ' . $superAdminName : 'Return as ' . $superAdminName }}
                    </button>
                </form>
            @else
                <a href="{{ route('dashboard') }}" 
                   style="background-color: #f1f5f9; color: #0f172a; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; border: 1px solid #cbd5e1; text-decoration: none;"
                   class="hover:bg-slate-200 transition-all shrink-0">
                    ← {{ $isMs ? 'Kembali ke Papan Pemuka' : 'Back to Dashboard' }}
                </a>
            @endif
        </div>
    </div>

    {{-- Notifications --}}
    @if(session('success'))
        <div style="background-color: #ecfdf5; border: 1px solid #6ee7b7; color: #065f46; padding: 14px; border-radius: 10px;" class="font-bold text-sm shadow-sm flex items-center gap-2">
            <span>✅</span>
            <span>{{ session('success') }}</span>
        </div>
    @endif

    {{-- Hierarchy & Upline Network Information Card --}}
    <div style="background-color: #ffffff; border: 1px solid #cbd5e1; padding: 24px; border-radius: 12px;" class="shadow-sm space-y-4">
        <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;" class="flex items-center justify-between">
            <h2 style="color: #0f172a; font-weight: 900; font-size: 16px;" class="flex items-center gap-2">
                🏢 {{ $isMs ? 'Maklumat Tenant & Rangkaian Hierarki Upline' : 'Tenant & Upline Network Information' }}
            </h2>
            <span style="background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; padding: 3px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px;">
                OFFICIAL HIERARCHY
            </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            {{-- Current Tenant --}}
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 16px; border-radius: 10px;" class="space-y-1">
                <div style="color: #64748b; font-weight: 800; font-size: 11px; text-transform: uppercase;">{{ $isMs ? 'Organisasi Tenant Semasa' : 'Current Tenant Organisation' }}</div>
                <div style="color: #0f172a; font-weight: 900; font-size: 15px;">{{ $tenant ? $tenant->name : ($isSuperAdmin ? 'Platform Root Context' : 'N/A') }}</div>
                <div style="color: #475569; font-family: monospace; font-size: 12px;">SSM: {{ $tenant && $tenant->ssm_number ? $tenant->ssm_number : '-' }}</div>
            </div>

            {{-- Upline Network Status --}}
            @if($isSuperAdmin)
                <div style="background-color: #fef3c7; border: 1px solid #fde68a; padding: 16px; border-radius: 10px;" class="space-y-1">
                    <div style="color: #92400e; font-weight: 900; font-size: 11px; text-transform: uppercase;" class="flex items-center gap-1.5">
                        👑 <span>{{ $isMs ? 'Kedudukan Hierarki Sejagat' : 'Global Hierarchy Standing' }}</span>
                    </div>
                    <div style="color: #78350f; font-weight: 900; font-size: 15px;">
                        Sole Platform Root Owner
                    </div>
                    <div style="color: #92400e; font-weight: 700; font-size: 12px;">
                        {{ $isMs ? 'Tiada akaun upline di atas anda (Supreme Authority).' : 'No upline exists above you (Supreme Authority).' }}
                    </div>
                </div>
            @else
                <div style="background-color: #f0fdf4; border: 1px solid #a7f3d0; padding: 16px; border-radius: 10px;" class="space-y-1">
                    <div style="color: #065f46; font-weight: 900; font-size: 11px; text-transform: uppercase;" class="flex items-center gap-1.5">
                        🛡️ <span>{{ $isMs ? 'Akaun Upline Utama (Master Mediator)' : 'Primary Upline Master Mediator' }}</span>
                    </div>
                    <div style="color: #064e3b; font-weight: 900; font-size: 15px;">
                        {{ $upline->name ?? 'Demo Trading Sdn Bhd (Master Mediator #1)' }}
                    </div>
                    <div style="color: #047857; font-weight: 700; font-size: 12px;">
                        📧 {{ $upline->contact_email ?? 'mediator@kojid.com.my' }} 
                        @if(isset($upline->contact_phone))
                            • 📞 {{ $upline->contact_phone }}
                        @endif
                    </div>
                </div>
            @endif
        </div>
    </div>

    {{-- Update Profile & Password Form --}}
    <form method="POST" action="{{ route('profile.update') }}" style="background-color: #ffffff; border: 1px solid #cbd5e1; padding: 24px; border-radius: 12px;" class="shadow-sm space-y-6">
        @csrf

        <h2 style="color: #0f172a; font-weight: 900; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;" class="flex items-center gap-2">
            👤 {{ $isMs ? 'Kemas Kini Akaun & Profil' : 'Update Account & Profile' }}
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label style="color: #0f172a; font-weight: 800; font-size: 12px;" class="block mb-1">{{ $isMs ? 'Nama Penuh / Wakil' : 'Full Name / Representative' }} *</label>
                <input type="text" name="name" value="{{ old('name', $user->name) }}" style="color: #0f172a; font-weight: 700; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; width: 100%;" required>
                @if(isset($errors) && $errors->has('name'))<p style="color: #dc2626; font-size: 11px; margin-top: 4px; font-weight: 700;">{{ $errors->first('name') }}</p>@endif
            </div>

            <div>
                <label style="color: #0f172a; font-weight: 800; font-size: 12px;" class="block mb-1">{{ $isMs ? 'Alamat E-mel Akaun' : 'Account Email Address' }} *</label>
                <input type="email" name="email" value="{{ old('email', $user->email) }}" style="color: #0f172a; font-weight: 700; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; width: 100%;" required>
                @if(isset($errors) && $errors->has('email'))<p style="color: #dc2626; font-size: 11px; margin-top: 4px; font-weight: 700;">{{ $errors->first('email') }}</p>@endif
            </div>

            <div>
                <label style="color: #0f172a; font-weight: 800; font-size: 12px;" class="block mb-1">{{ $isMs ? 'Bahasa Pilihan System' : 'System Preferred Language' }} *</label>
                <select name="locale" style="color: #0f172a; font-weight: 700; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; width: 100%;">
                    <option value="ms" {{ old('locale', $user->locale ?? 'ms') === 'ms' ? 'selected' : '' }}>🇲🇾 Bahasa Melayu (ms)</option>
                    <option value="en" {{ old('locale', $user->locale) === 'en' ? 'selected' : '' }}>🇬🇧 English (en)</option>
                </select>
            </div>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;" class="space-y-4">
            <h3 style="color: #0f172a; font-weight: 900; font-size: 14px;">{{ $isMs ? 'Tukar Kata Laluan (Opsional)' : 'Change Password (Optional)' }}</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label style="color: #0f172a; font-weight: 800; font-size: 12px;" class="block mb-1">{{ $isMs ? 'Kata Laluan Baharu' : 'New Password' }}</label>
                    <input type="password" name="password" placeholder="••••••••" style="color: #0f172a; font-weight: 700; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; width: 100%;">
                    @if(isset($errors) && $errors->has('password'))<p style="color: #dc2626; font-size: 11px; margin-top: 4px; font-weight: 700;">{{ $errors->first('password') }}</p>@endif
                </div>

                <div>
                    <label style="color: #0f172a; font-weight: 800; font-size: 12px;" class="block mb-1">{{ $isMs ? 'Sahkan Kata Laluan Baharu' : 'Confirm New Password' }}</label>
                    <input type="password" name="password_confirmation" placeholder="••••••••" style="color: #0f172a; font-weight: 700; background-color: #ffffff; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; width: 100%;">
                </div>
            </div>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 16px;" class="flex items-center justify-end">
            <button type="submit" 
                    style="background-color: #047857; color: #ffffff; padding: 10px 22px; border-radius: 10px; font-weight: 900; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid #065f46; cursor: pointer;">
                <span>✓</span>
                <span>{{ $isMs ? 'Simpan Profil Akaun' : 'Save Profile Changes' }}</span>
            </button>
        </div>
    </form>
</div>
@endsection
