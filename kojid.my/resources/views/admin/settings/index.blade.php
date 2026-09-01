@extends('layouts.app')

@section('title', 'Tetapan Sistem Platform / Systemwide Settings')

@section('content')
<div class="space-y-6" x-data="{ 
    isEditing: {{ $isEditingMode ? 'true' : 'false' }}, 
    showPasswordModal: {{ (isset($errors) && $errors->has('confirm_password')) ? 'true' : 'false' }},
    restoreDefaults() {
        if (confirm('Adakah anda pasti untuk memulihkan semua tetapan sistem ke nilai asal? / Are you sure you want to restore all sitewide settings to factory defaults?')) {
            document.getElementById('restoreDefaultsForm').submit();
        }
    }
}">
    
    {{-- Notifications --}}
    @if(session('success'))
        <div class="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm font-bold rounded-xl shadow-sm flex items-center justify-between">
            <div class="flex items-center gap-2">
                <x-icon name="check-circle" class="w-5 h-5 text-emerald-600 shrink-0"/>
                <span>{{ session('success') }}</span>
            </div>
        </div>
    @endif

    @if(isset($errors) && $errors->any())
        <div class="p-4 bg-red-50 border border-red-300 text-red-900 text-sm font-bold rounded-xl shadow-sm space-y-1">
            <div class="flex items-center gap-2 font-bold">
                <x-icon name="exclamation-triangle" class="w-5 h-5 text-red-600 shrink-0"/>
                <span>Ralat Pengesahan / Validation Error:</span>
            </div>
            <ul class="list-disc ml-6 text-xs text-red-800">
                @foreach($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- Systemwide Settings Form --}}
    <form id="systemwideSettingsForm" method="POST" action="{{ route('super-admin.system-settings.update') }}" class="space-y-6">
        @csrf

        {{-- Header Card with Guaranteed Edit & Restore Buttons --}}
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-300 mb-2">
                    <x-icon name="shield-check" class="w-4 h-4 text-emerald-700"/>
                    EXCLUSIVE ROOT SUPER ADMIN CONTROL
                </div>
                <h1 class="text-2xl font-black text-slate-900 tracking-tight">Tetapan Sistem Platform / Systemwide Settings</h1>
                <p class="text-slate-600 text-sm mt-1">Kawalan Utama Pemilikan, Mata Wang, Bahasa & Operasi Platform KOJID</p>
            </div>
            
            <div class="flex items-center gap-3 shrink-0">
                {{-- Mode: View Only --}}
                <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                    <a href="{{ route('super-admin.system-settings.index', ['mode' => 'edit']) }}"
                       @click.prevent="isEditing = true"
                       style="background-color: #059669; color: #ffffff; padding: 10px 20px; border-radius: 10px; font-weight: 800; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; border: 1px solid #047857; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                       class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md">
                        <x-icon name="pencil-square" class="w-4 h-4"/>
                        <span>Edit Tetapan / Edit Settings</span>
                    </a>
                </div>

                {{-- Mode: Editing Active --}}
                <div x-show="isEditing" style="{{ $isEditingMode ? 'display: flex; gap: 10px;' : 'display: none;' }}" class="flex items-center gap-2.5 flex-wrap">
                    {{-- Cancel Button --}}
                    <a href="{{ route('super-admin.system-settings.index') }}"
                       @click.prevent="isEditing = false"
                       style="background-color: #f1f5f9; color: #334155; padding: 10px 16px; border-radius: 10px; font-weight: 800; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #cbd5e1;"
                       class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
                        <span>Batal / Cancel</span>
                    </a>

                    {{-- Restore To Default Button --}}
                    <button type="button"
                            @click="restoreDefaults()"
                            style="background-color: #fffbebf5; color: #b45309; padding: 10px 16px; border-radius: 10px; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #fcd34d; cursor: pointer;"
                            class="px-4 py-2.5 bg-amber-50 text-amber-800 rounded-xl font-bold text-xs hover:bg-amber-100 transition-all border border-amber-300 flex items-center gap-1.5"
                            title="Pulihkan ke nilai asal / Restore to factory defaults">
                        <x-icon name="arrow-path" class="w-4 h-4 text-amber-700"/>
                        <span>Pulihkan ke Asal / Restore To Default</span>
                    </button>

                    {{-- Save Button --}}
                    <button type="button"
                            @click="showPasswordModal = true"
                            style="background-color: #047857; color: #ffffff; padding: 10px 20px; border-radius: 10px; font-weight: 900; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #065f46; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.15);"
                            class="px-5 py-2.5 bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2">
                        <x-icon name="check" class="w-4 h-4"/>
                        <span>Simpan Tetapan / Save Settings</span>
                    </button>
                </div>
            </div>
        </div>

        {{-- Section 1: System Ownership & Sole Super Admin Reassignment --}}
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 class="text-lg font-black text-slate-900 flex items-center gap-2">
                    <x-icon name="key" class="w-5 h-5 text-amber-600"/>
                    Status Pemilikan Utama Sistem (Platform Root Ownership Status)
                </h2>
                <span class="px-2.5 py-1 bg-amber-50 text-amber-800 text-[11px] font-bold rounded-full border border-amber-300">
                    SOLE ROOT ROLE ASSIGNMENT
                </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {{-- Super Admin Email / Reassignment --}}
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-xs text-slate-600 font-bold uppercase">Email Pentadbir Utama (Sole Super Admin Email)</div>
                    
                    <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <div class="text-lg font-black text-emerald-800 mt-1 font-mono">
                            {{ $systemStatus['sole_super_admin_email'] }}
                        </div>
                        <div class="text-xs text-slate-500 mt-1">Alamat e-mel ini adalah satu-satunya Pentadbir Utama (Sole Root Super Admin) platform.</div>
                    </div>

                    <div x-show="isEditing" style="{{ $isEditingMode ? 'display: block;' : 'display: none;' }}" class="mt-2 space-y-2">
                        <label class="block text-xs font-bold text-slate-800">Tukar Pentadbir Utama / Reassign Sole Super Admin Role:</label>
                        <select name="reassign_super_admin_user_id" class="w-full text-xs font-mono font-bold rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 p-2.5 border">
                            @foreach($activeUsers as $usr)
                                <option value="{{ $usr->id }}" {{ strtolower($usr->email) === strtolower($systemStatus['sole_super_admin_email']) ? 'selected' : '' }}>
                                    {{ $usr->name }} ({{ $usr->email }})
                                </option>
                            @endforeach
                        </select>
                        <div class="text-[11px] text-amber-700 font-semibold italic">* Memindahkan peranan pentadbir utama kepada akaun lain yang aktif.</div>
                    </div>
                </div>

                {{-- Status Verification --}}
                <div class="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div class="text-xs text-emerald-800 font-bold uppercase">Status Sah Pengesahan (Ownership Status)</div>
                    <div class="text-sm font-black text-emerald-950 mt-1 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse"></span>
                        {{ $systemStatus['root_status'] }}
                    </div>
                    <div class="text-xs text-emerald-700 mt-1">Pemegang hak penuh ke atas ekosistem multi-tenant & ledger kewangan.</div>
                </div>
            </div>
        </div>

        {{-- Section 2: Regional, Currency & Language Controls --}}
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 class="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <x-icon name="globe-alt" class="w-5 h-5 text-indigo-600"/>
                Kawalan Mata Wang & Bahasa (Regional, Currency & Language Controls)
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                {{-- Operational Currency --}}
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-xs text-slate-600 font-bold">Mata Wang Operasi (Operational Currency)</div>
                    <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <div class="text-base font-black text-slate-900 mt-1 font-mono">
                            {{ $systemStatus['default_currency'] }} ({{ $systemStatus['default_currency'] === 'MYR' ? 'RM' : '$' }})
                        </div>
                    </div>
                    <div x-show="isEditing" style="{{ $isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <select name="default_currency" class="w-full text-xs font-bold rounded-xl border-slate-300 mt-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 p-2.5 border">
                            <option value="MYR" {{ $systemStatus['default_currency'] === 'MYR' ? 'selected' : '' }}>MYR (Ringgit Malaysia - RM)</option>
                            <option value="USD" {{ $systemStatus['default_currency'] === 'USD' ? 'selected' : '' }}>USD (US Dollar - $)</option>
                            <option value="SGD" {{ $systemStatus['default_currency'] === 'SGD' ? 'selected' : '' }}>SGD (Singapore Dollar - S$)</option>
                            <option value="EUR" {{ $systemStatus['default_currency'] === 'EUR' ? 'selected' : '' }}>EUR (Euro - €)</option>
                        </select>
                    </div>
                </div>

                {{-- Default System Language --}}
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-xs text-slate-600 font-bold">Bahasa Utama Sistem (Default System Language)</div>
                    <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <div class="text-base font-black text-slate-900 mt-1">
                            {{ $systemStatus['default_language'] === 'ms' ? '🇲🇾 Bahasa Melayu (ms)' : '🇬🇧 English (en)' }}
                        </div>
                    </div>
                    <div x-show="isEditing" style="{{ $isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <select name="default_language" class="w-full text-xs font-bold rounded-xl border-slate-300 mt-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 p-2.5 border">
                            <option value="ms" {{ $systemStatus['default_language'] === 'ms' ? 'selected' : '' }}>🇲🇾 Bahasa Melayu (ms)</option>
                            <option value="en" {{ $systemStatus['default_language'] === 'en' ? 'selected' : '' }}>🇬🇧 English (en)</option>
                        </select>
                    </div>
                </div>

                {{-- System Timezone --}}
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-xs text-slate-600 font-bold">Zon Masa Platform (System Timezone)</div>
                    <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <div class="text-base font-black text-slate-900 mt-1 font-mono">
                            {{ $systemStatus['default_timezone'] }} (UTC+8)
                        </div>
                    </div>
                    <div x-show="isEditing" style="{{ $isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <select name="default_timezone" class="w-full text-xs font-bold rounded-xl border-slate-300 mt-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 p-2.5 border">
                            <option value="Asia/Kuala_Lumpur" {{ $systemStatus['default_timezone'] === 'Asia/Kuala_Lumpur' ? 'selected' : '' }}>Asia/Kuala_Lumpur (UTC+08:00)</option>
                            <option value="Asia/Singapore" {{ $systemStatus['default_timezone'] === 'Asia/Singapore' ? 'selected' : '' }}>Asia/Singapore (UTC+08:00)</option>
                            <option value="UTC" {{ $systemStatus['default_timezone'] === 'UTC' ? 'selected' : '' }}>UTC (Coordinated Universal Time)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        {{-- Section 3: Operations, Gateway & Security Controls --}}
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 class="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <x-icon name="cog-6-tooth" class="w-5 h-5 text-blue-600"/>
                Kawalan Operasi & Keselamatan (Platform Operations & Security)
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                {{-- Maintenance Mode --}}
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-xs text-slate-600 font-bold">Mod Penyelenggaraan (Maintenance Mode)</div>
                    <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <div class="text-base font-black mt-1 {{ $systemStatus['platform_maintenance_mode'] === 'OFF' ? 'text-emerald-700' : 'text-amber-700' }}">
                            {{ $systemStatus['platform_maintenance_mode'] === 'OFF' ? 'OFF (Live Operations Active)' : 'ON (System Under Maintenance)' }}
                        </div>
                    </div>
                    <div x-show="isEditing" style="{{ $isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <select name="platform_maintenance_mode" class="w-full text-xs font-bold rounded-xl border-slate-300 mt-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 p-2.5 border">
                            <option value="OFF" {{ $systemStatus['platform_maintenance_mode'] === 'OFF' ? 'selected' : '' }}>OFF (Live Operations Active)</option>
                            <option value="ON" {{ $systemStatus['platform_maintenance_mode'] === 'ON' ? 'selected' : '' }}>ON (System Under Maintenance)</option>
                        </select>
                    </div>
                </div>

                {{-- Invitation Gateway --}}
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-xs text-slate-600 font-bold">Gerbang Jemputan Email (Invitation Gateway)</div>
                    <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <div class="text-base font-black text-emerald-700 mt-1">
                            {{ $systemStatus['invitation_gateway_status'] }} (SMTP Verified)
                        </div>
                    </div>
                    <div x-show="isEditing" style="{{ $isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <select name="invitation_gateway_status" class="w-full text-xs font-bold rounded-xl border-slate-300 mt-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 p-2.5 border">
                            <option value="ENABLED" {{ $systemStatus['invitation_gateway_status'] === 'ENABLED' ? 'selected' : '' }}>ENABLED (Automated Token Gateway)</option>
                            <option value="DISABLED" {{ $systemStatus['invitation_gateway_status'] === 'DISABLED' ? 'selected' : '' }}>DISABLED (Manual Approval Required)</option>
                        </select>
                    </div>
                </div>

                {{-- Session Timeout --}}
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-xs text-slate-600 font-bold">Masa Tamat Sesi (Session Timeout)</div>
                    <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <div class="text-base font-black text-slate-900 mt-1 font-mono">
                            {{ $systemStatus['session_timeout_minutes'] }} Minutes
                        </div>
                    </div>
                    <div x-show="isEditing" style="{{ $isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <select name="session_timeout_minutes" class="w-full text-xs font-bold rounded-xl border-slate-300 mt-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 p-2.5 border">
                            <option value="30" {{ $systemStatus['session_timeout_minutes'] === '30' ? 'selected' : '' }}>30 Minutes</option>
                            <option value="60" {{ $systemStatus['session_timeout_minutes'] === '60' ? 'selected' : '' }}>60 Minutes (Default)</option>
                            <option value="120" {{ $systemStatus['session_timeout_minutes'] === '120' ? 'selected' : '' }}>120 Minutes</option>
                            <option value="480" {{ $systemStatus['session_timeout_minutes'] === '480' ? 'selected' : '' }}>480 Minutes (8 Hours)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        {{-- Section 4: Trading & Quota Policy Defaults --}}
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h2 class="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <x-icon name="shopping-bag" class="w-5 h-5 text-emerald-600"/>
                Polisi Kuota & Dagangan (Trading & Quota Defaults)
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                {{-- Default Quota Commodity --}}
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-xs text-slate-600 font-bold">Komoditi Kuota Utama (Default Quota Commodity)</div>
                    <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <div class="text-base font-black text-slate-900 mt-1 font-mono">
                            {{ $systemStatus['default_quota_commodity'] }}
                        </div>
                    </div>
                    <div x-show="isEditing" style="{{ $isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <select name="default_quota_commodity" class="w-full text-xs font-bold rounded-xl border-slate-300 mt-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 p-2.5 border">
                            <option value="COOKING_OIL_BULK" {{ $systemStatus['default_quota_commodity'] === 'COOKING_OIL_BULK' ? 'selected' : '' }}>COOKING_OIL_BULK (Minyak Masak Paket/Pukal)</option>
                            <option value="RICE_BERNAS" {{ $systemStatus['default_quota_commodity'] === 'RICE_BERNAS' ? 'selected' : '' }}>RICE_BERNAS (Beras Putih Tempatan)</option>
                            <option value="SUGAR_KPDNHEP" {{ $systemStatus['default_quota_commodity'] === 'SUGAR_KPDNHEP' ? 'selected' : '' }}>SUGAR_KPDNHEP (Gula Kasar Bersubsidi)</option>
                        </select>
                    </div>
                </div>

                {{-- Deposit Overdraft Policy --}}
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div class="text-xs text-slate-600 font-bold">Polisi Overdraf Deposit (Deposit Overdraft Policy)</div>
                    <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <div class="text-base font-black text-slate-900 mt-1">
                            {{ $systemStatus['deposit_overdraft_policy'] === 'DISALLOW' ? 'DISALLOW (Strict Collateral Block)' : 'ALLOW (Permissive Trade Warning)' }}
                        </div>
                    </div>
                    <div x-show="isEditing" style="{{ $isEditingMode ? 'display: block;' : 'display: none;' }}">
                        <select name="deposit_overdraft_policy" class="w-full text-xs font-bold rounded-xl border-slate-300 mt-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 p-2.5 border">
                            <option value="DISALLOW" {{ $systemStatus['deposit_overdraft_policy'] === 'DISALLOW' ? 'selected' : '' }}>DISALLOW (Strict Collateral Block)</option>
                            <option value="ALLOW" {{ $systemStatus['deposit_overdraft_policy'] === 'ALLOW' ? 'selected' : '' }}>ALLOW (Permissive Trade Warning)</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        {{-- Bottom Action Footer --}}
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div x-show="!isEditing" style="{{ !$isEditingMode ? 'display: block;' : 'display: none;' }}">
                <a href="{{ route('super-admin.system-settings.index', ['mode' => 'edit']) }}"
                   @click.prevent="isEditing = true"
                   style="background-color: #059669; color: #ffffff; padding: 10px 20px; border-radius: 10px; font-weight: 800; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; border: 1px solid #047857; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                   class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-md">
                    <x-icon name="pencil-square" class="w-4 h-4"/>
                    <span>Edit Tetapan / Edit Settings</span>
                </a>
            </div>

            <div x-show="isEditing" style="{{ $isEditingMode ? 'display: flex; gap: 10px;' : 'display: none;' }}" class="flex items-center gap-2.5 flex-wrap">
                {{-- Cancel Button --}}
                <a href="{{ route('super-admin.system-settings.index') }}"
                   @click.prevent="isEditing = false"
                   style="background-color: #f1f5f9; color: #334155; padding: 10px 16px; border-radius: 10px; font-weight: 800; font-size: 13px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #cbd5e1;"
                   class="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
                    <span>Batal / Cancel</span>
                </a>

                {{-- Restore To Default Button --}}
                <button type="button"
                        @click="restoreDefaults()"
                        style="background-color: #fffbebf5; color: #b45309; padding: 10px 16px; border-radius: 10px; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #fcd34d; cursor: pointer;"
                        class="px-4 py-2.5 bg-amber-50 text-amber-800 rounded-xl font-bold text-xs hover:bg-amber-100 transition-all border border-amber-300 flex items-center gap-1.5"
                        title="Pulihkan ke nilai asal / Restore to factory defaults">
                    <x-icon name="arrow-path" class="w-4 h-4 text-amber-700"/>
                    <span>Pulihkan ke Asal / Restore To Default</span>
                </button>

                {{-- Save Button --}}
                <button type="button"
                        @click="showPasswordModal = true"
                        style="background-color: #047857; color: #ffffff; padding: 10px 22px; border-radius: 10px; font-weight: 900; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #065f46; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.15);"
                        class="px-6 py-2.5 bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 border border-emerald-800">
                    <x-icon name="check" class="w-4 h-4"/>
                    <span>Simpan Tetapan Sistem / Save Sitewide Settings</span>
                </button>
            </div>
        </div>

        {{-- Password Verification Modal --}}
        <div x-show="showPasswordModal" 
             style="{{ (isset($errors) && $errors->has('confirm_password')) ? 'display: flex;' : 'display: none;' }}"
             x-transition.opacity
             class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div @click.outside="showPasswordModal = false"
                 class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
                
                <div class="flex items-center gap-3 text-amber-600">
                    <div class="p-3 bg-amber-100 rounded-xl border border-amber-300">
                        <x-icon name="lock-closed" class="w-6 h-6 text-amber-800"/>
                    </div>
                    <div>
                        <h3 class="text-base font-black text-slate-900">Pengesahan Keselamatan</h3>
                        <p class="text-xs text-slate-600">Super Admin Security Re-Verification</p>
                    </div>
                </div>

                <p class="text-xs text-slate-700 leading-relaxed font-medium">
                    Sila masukkan kata laluan akaun anda sekali lagi untuk mengesahkan dan menyimpan tetapan sistem sejagat ini.
                    <br>
                    <span class="italic text-slate-500 text-[11px]">* Password re-verification is required strictly for sitewide platform settings updates.</span>
                </p>

                <div class="space-y-2">
                    <label class="block text-xs font-bold text-slate-800">Kata Laluan Anda (Your Password):</label>
                    <input type="password" 
                           name="confirm_password" 
                           required 
                           placeholder="••••••••"
                           class="w-full text-sm font-bold rounded-xl border-slate-300 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-900 p-3 border">
                </div>

                <div class="flex items-center justify-end gap-3 pt-2">
                    <button type="button" 
                            @click="showPasswordModal = false"
                            class="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors">
                        Batal / Cancel
                    </button>
                    <button type="submit" 
                            style="background-color: #047857; color: #ffffff; padding: 10px 20px; border-radius: 10px; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid #065f46; cursor: pointer;"
                            class="px-5 py-2.5 bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 border border-emerald-800">
                        <x-icon name="check-circle" class="w-4 h-4"/>
                        <span>Sahkan & Simpan / Confirm & Save</span>
                    </button>
                </div>
            </div>
        </div>

    </form>

    {{-- Standalone Restore Defaults Form --}}
    <form id="restoreDefaultsForm" method="POST" action="{{ route('super-admin.system-settings.restore-defaults') }}" class="hidden">
        @csrf
    </form>
</div>
@endsection
