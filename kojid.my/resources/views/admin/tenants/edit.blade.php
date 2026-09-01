@extends('layouts.app')
@section('title', __('tenants.edit_tenant'))

@section('content')
<div class="max-w-3xl mx-auto space-y-6">
    <div class="page-header">
        <div>
            <h1 class="page-title">{{ __('tenants.edit_tenant') }}</h1>
            <p class="page-subtitle">{{ $tenant->name }}</p>
        </div>
        <a href="{{ route('admin.tenants.index') }}" class="btn-secondary btn-sm">{{ __('app.back') }}</a>
    </div>

    <form method="POST" action="{{ route('admin.tenants.update', $tenant) }}" enctype="multipart/form-data">
        @csrf
        @method('PUT')

        <div class="card">
            <div class="card-header">
                <h2 class="font-semibold text-slate-800">{{ __('tenants.tenant_info') }}</h2>
            </div>
            <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="form-label">{{ __('tenants.tenant_name') }} *</label>
                    <input type="text" name="name" value="{{ old('name', $tenant->name) }}" class="form-input" data-title-case required>
                    @error('name')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">Slug *</label>
                    <input type="text" name="slug" value="{{ old('slug', $tenant->slug) }}" class="form-input" data-slug required>
                    @error('slug')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">{{ __('tenants.contact_email') }} *</label>
                    <input type="email" name="contact_email" value="{{ old('contact_email', $tenant->contact_email) }}" class="form-input" required>
                    @error('contact_email')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">{{ __('tenants.contact_phone') }}</label>
                    <input type="text" name="contact_phone" value="{{ old('contact_phone', $tenant->contact_phone) }}" class="form-input" data-phone-dash>
                    @error('contact_phone')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">{{ __('tenants.ssm_number') }}</label>
                    <input type="text" name="ssm_number" value="{{ old('ssm_number', $tenant->ssm_number) }}" class="form-input" data-upper-case>
                    @error('ssm_number')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">Domain</label>
                    <input type="text" name="domain" value="{{ old('domain', $tenant->domain) }}" class="form-input" placeholder="contoh: tenant.kojid.my">
                    @error('domain')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4 mt-2">
                    <h3 class="md:col-span-2 font-semibold text-slate-700">{{ __('tenants.business_address') }}</h3>
                    
                    <div class="md:col-span-2">
                        <label class="form-label">{{ __('tenants.address_line1') }} *</label>
                        <input type="text" name="address_line1" value="{{ old('address_line1', $tenant->address_line1) }}" class="form-input" required placeholder="No. Rumah, Jalan / Lorong">
                        @error('address_line1')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div class="md:col-span-2">
                        <label class="form-label">{{ __('tenants.address_line2') }}</label>
                        <input type="text" name="address_line2" value="{{ old('address_line2', $tenant->address_line2) }}" class="form-input" placeholder="Taman, Seksyen, Kampung">
                        @error('address_line2')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div class="md:col-span-2">
                        <label class="form-label">{{ __('tenants.address_line3') }}</label>
                        <input type="text" name="address_line3" value="{{ old('address_line3', $tenant->address_line3) }}" class="form-input" placeholder="Bangunan, Tingkat, Unit">
                        @error('address_line3')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">{{ __('tenants.postcode') }} *</label>
                        <input type="text" name="postcode" value="{{ old('postcode', $tenant->postcode) }}" class="form-input" required maxlength="5" placeholder="contoh: 50000">
                        @error('postcode')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">{{ __('tenants.town') }} *</label>
                        <input type="text" name="town" value="{{ old('town', $tenant->town) }}" class="form-input" required placeholder="contoh: Kuala Lumpur">
                        @error('town')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">{{ __('tenants.state') }} *</label>
                        <select name="state" class="form-input" required>
                             <option value="">{{ __('tenants.select_state') }}</option>
                            @foreach([
                                'Kuala Lumpur', 'Selangor', 'Johor', 'Penang', 'Perak', 'Kedah', 
                                'Kelantan', 'Terengganu', 'Pahang', 'Negeri Sembilan', 'Melaka', 
                                'Perlis', 'Sabah', 'Sarawak', 'Labuan', 'Putrajaya'
                            ] as $stateOpt)
                                <option value="{{ $stateOpt }}" {{ old('state', $tenant->state) === $stateOpt ? 'selected' : '' }}>{{ $stateOpt }}</option>
                            @endforeach
                        </select>
                        @error('state')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">{{ __('tenants.country') }} *</label>
                        <select name="country" class="form-input" required>
                             <option value="">{{ __('tenants.select_country') }}</option>
                            <option value="Malaysia" {{ old('country', $tenant->country ?? 'Malaysia') === 'Malaysia' ? 'selected' : '' }}>Malaysia</option>
                            <option value="Singapore" {{ old('country', $tenant->country) === 'Singapore' ? 'selected' : '' }}>Singapore</option>
                            <option value="Indonesia" {{ old('country', $tenant->country) === 'Indonesia' ? 'selected' : '' }}>Indonesia</option>
                            <option value="Thailand" {{ old('country', $tenant->country) === 'Thailand' ? 'selected' : '' }}>Thailand</option>
                            <option value="Brunei" {{ old('country', $tenant->country) === 'Brunei' ? 'selected' : '' }}>Brunei</option>
                        </select>
                        @error('country')<p class="form-error">{{ $message }}</p>@enderror
                    </div>
                </div>

                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4 mt-2">
                    <h3 class="md:col-span-2 font-semibold text-slate-700">{{ __('tenants.password_checks') }}</h3>
                    
                    <div>
                        <label class="form-label">{{ __('tenants.password') }}</label>
                        <input type="password" name="password" class="form-input" placeholder="{{ __('tenants.password_placeholder') }}">
                        @error('password')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">{{ __('tenants.password_confirm') }}</label>
                        <input type="password" name="password_confirmation" class="form-input" placeholder="{{ __('tenants.password_placeholder') }}">
                        @error('password_confirmation')<p class="form-error">{{ $message }}</p>@enderror
                    </div>
                </div>

                <div class="md:col-span-2 space-y-2 border-t border-slate-100 pt-4">
                    <label class="form-label font-semibold text-slate-700">Peranan Utama Tenant (Single Tenant Role) *</label>
                    <p class="text-xs text-slate-500 mb-2">Setiap tenant wajib mempunyai **HANYA SATU PERANAN UTAMA** di dalam ekosistem platform.</p>
                    
                    @php
                        $currentRole = is_array($tenant->tenant_types) ? ($tenant->tenant_types[0] ?? 'actual_supplier') : 'actual_supplier';
                    @endphp

                    @if($currentRole === 'mediator')
                        <div class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-bold flex items-center gap-2">
                            <x-icon name="shield-check" class="w-4 h-4 text-amber-600"/>
                            <span>Master Tenant / Mediator Hub (Peranan Utama Sistem)</span>
                            <input type="hidden" name="tenant_type" value="mediator">
                        </div>
                    @else
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none p-3 rounded-xl hover:bg-slate-50 border border-slate-200">
                                <input type="radio" name="tenant_type" value="actual_supplier" class="text-emerald-600 focus:ring-emerald-500" {{ old('tenant_type', $currentRole) === 'actual_supplier' ? 'checked' : '' }} required>
                                <div>
                                    <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                        <x-icon name="truck" class="w-4 h-4 text-emerald-600"/>
                                        Pembekal Fizikal (Actual Seller)
                                    </span>
                                    <span class="block text-xs text-slate-500">Pengeluar / Pembekal Barangan Fizikal (AS)</span>
                                </div>
                            </label>

                            <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none p-3 rounded-xl hover:bg-slate-50 border border-slate-200">
                                <input type="radio" name="tenant_type" value="virtual_seller" class="text-emerald-600 focus:ring-emerald-500" {{ old('tenant_type', $currentRole) === 'virtual_seller' ? 'checked' : '' }} required>
                                <div>
                                    <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                        <x-icon name="receipt-percent" class="w-4 h-4 text-indigo-600"/>
                                        Pembekal Maya (Virtual Seller)
                                    </span>
                                    <span class="block text-xs text-slate-500">Pemegang & Pelepas Kuota Komoditi (VS)</span>
                                </div>
                            </label>

                            <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none p-3 rounded-xl hover:bg-slate-50 border border-slate-200">
                                <input type="radio" name="tenant_type" value="standard_buyer" class="text-emerald-600 focus:ring-emerald-500" {{ old('tenant_type', $currentRole) === 'standard_buyer' ? 'checked' : '' }} required>
                                <div>
                                    <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                        <x-icon name="shopping-bag" class="w-4 h-4 text-blue-600"/>
                                        Pembeli Fizikal (Actual Buyer)
                                    </span>
                                    <span class="block text-xs text-slate-500">Pembeli Komersial Komoditi (AB)</span>
                                </div>
                            </label>

                            <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none p-3 rounded-xl hover:bg-slate-50 border border-slate-200">
                                <input type="radio" name="tenant_type" value="buyer_with_quota" class="text-emerald-600 focus:ring-emerald-500" {{ old('tenant_type', $currentRole) === 'buyer_with_quota' ? 'checked' : '' }} required>
                                <div>
                                    <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                        <x-icon name="ticket" class="w-4 h-4 text-amber-600"/>
                                        Pembeli Maya (Virtual Buyer)
                                    </span>
                                    <span class="block text-xs text-slate-500">Pembeli Tertakluk Had Kuota (VB)</span>
                                </div>
                            </label>

                            <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none p-3 rounded-xl hover:bg-slate-50 border border-slate-200 md:col-span-2">
                                <input type="radio" name="tenant_type" value="auditor" class="text-emerald-600 focus:ring-emerald-500" {{ old('tenant_type', $currentRole) === 'auditor' ? 'checked' : '' }} required>
                                <div>
                                    <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                        <x-icon name="shield-check" class="w-4 h-4 text-purple-600"/>
                                        Juruaudit (Auditor)
                                    </span>
                                    <span class="block text-xs text-slate-500">Pegawai Pematuhan & Semakan Ekosistem (Read-Only)</span>
                                </div>
                            </label>
                        </div>
                    @endif
                    @error('tenant_type')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4 mt-2">
                    <h3 class="md:col-span-2 font-semibold text-slate-700">{{ __('tenants.hierarchy_branding') }}</h3>
                    
                    <div>
                        <label class="form-label">{{ __('tenants.parent_tenant') }}</label>
                        <select name="parent_id_disabled" class="form-input bg-slate-100 text-slate-500 cursor-not-allowed" disabled>
                            <option value="">{{ __('tenants.no_parent') }}</option>
                            @foreach(\App\Models\Tenant::whereNull('parent_id')->get() as $p)
                                <option value="{{ $p->id }}" {{ $tenant->parent_id == $p->id ? 'selected' : '' }}>{{ $p->name }}</option>
                            @endforeach
                        </select>
                        <input type="hidden" name="parent_id" value="{{ $tenant->parent_id }}">
                        <p class="text-xs text-slate-500 mt-1">{{ __('tenants.hierarchy_immutable') }}</p>
                    </div>

                    <div>
                        <label class="form-label">{{ __('tenants.theme_style') }}</label>
                        <select name="settings[branding][ui_template]" class="form-input">
                            <option value="slate" {{ old('settings.branding.ui_template', $tenant->getSetting('branding.ui_template')) === 'slate' ? 'selected' : '' }}>Default Slate</option>
                            <option value="emerald" {{ old('settings.branding.ui_template', $tenant->getSetting('branding.ui_template')) === 'emerald' ? 'selected' : '' }}>Emerald Corporate</option>
                            <option value="amber" {{ old('settings.branding.ui_template', $tenant->getSetting('branding.ui_template')) === 'amber' ? 'selected' : '' }}>Amber Minimalist</option>
                            <option value="midnight" {{ old('settings.branding.ui_template', $tenant->getSetting('branding.ui_template')) === 'midnight' ? 'selected' : '' }}>Midnight Dark</option>
                        </select>
                    </div>

                    @if($tenant->parent_id === null)
                    <div>
                        <label class="form-label">{{ __('tenants.default_locale') }} *</label>
                        <select name="settings[system][default_locale]" class="form-input">
                            <option value="ms" {{ old('settings.system.default_locale', $tenant->getSetting('system.default_locale', 'ms')) === 'ms' ? 'selected' : '' }}>Bahasa Melayu (Malay)</option>
                            <option value="en" {{ old('settings.system.default_locale', $tenant->getSetting('system.default_locale')) === 'en' ? 'selected' : '' }}>English</option>
                        </select>
                    </div>
                    @endif

                    <div class="md:col-span-2">
                        <label class="form-label">{{ __('tenants.logo') }}</label>
                        @if($tenant->logo_path)
                            <div class="flex items-center gap-4 mb-2 p-2 bg-slate-50 border border-slate-200 rounded">
                                <img src="{{ asset('storage/' . $tenant->logo_path) }}" alt="Logo" class="h-12 w-auto object-contain">
                                <span class="text-xs text-slate-500">{{ basename($tenant->logo_path) }}</span>
                            </div>
                        @endif
                        <input type="file" name="logo_file" class="form-input">
                        <p class="text-xs text-slate-500 mt-1">{{ __('tenants.logo_sub') }}</p>
                    </div>
                </div>

                <div class="md:col-span-2 space-y-2 border-t border-slate-100 pt-4">
                    <label class="form-label font-semibold text-slate-700">{{ __('tenants.registration_status') }}</label>
                    <p class="text-xs text-slate-500 mb-2">{{ __('tenants.registration_status_sub') }}</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none p-2 rounded hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="status" value="dummy" class="border-slate-300 text-kojid-green focus:ring-kojid-green" {{ old('status', $tenant->status) === 'dummy' ? 'checked' : '' }}>
                            <div>
                                <span class="font-medium text-slate-800">{{ __('tenants.status_dummy') }}</span>
                                <span class="block text-xs text-slate-500">{{ __('tenants.status_dummy_sub') }}</span>
                            </div>
                        </label>
                        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none p-2 rounded hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="status" value="provisional" class="border-slate-300 text-kojid-green focus:ring-kojid-green" {{ old('status', $tenant->status) === 'provisional' ? 'checked' : '' }}>
                            <div>
                                <span class="font-medium text-slate-800">{{ __('tenants.status_provisional') }}</span>
                                <span class="block text-xs text-slate-500">{{ __('tenants.status_provisional_sub') }}</span>
                            </div>
                        </label>
                        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none p-2 rounded hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="status" value="permanent" class="border-slate-300 text-kojid-green focus:ring-kojid-green" {{ old('status', $tenant->status) === 'permanent' ? 'checked' : '' }}>
                            <div>
                                <span class="font-medium text-slate-800">{{ __('tenants.status_permanent') }}</span>
                                <span class="block text-xs text-slate-500">{{ __('tenants.status_permanent_sub') }}</span>
                            </div>
                        </label>
                        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none p-2 rounded hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="status" value="suspended" class="border-slate-300 text-kojid-green focus:ring-kojid-green" {{ old('status', $tenant->status) === 'suspended' ? 'checked' : '' }}>
                            <div>
                                <span class="font-medium text-slate-800">{{ __('tenants.status_suspended') }}</span>
                                <span class="block text-xs text-slate-500">{{ __('tenants.status_suspended_sub') }}</span>
                            </div>
                        </label>
                    </div>
                    @error('status')<p class="form-error">{{ $message }}</p>@enderror
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
            <a href="{{ route('admin.tenants.index') }}" class="btn-secondary">{{ __('app.cancel') }}</a>
            <button type="submit" class="btn-primary">
                <x-icon name="check" class="w-4 h-4"/>
                {{ __('tenants.save_changes') }}
            </button>
        </div>
    </form>
</div>

@include('admin.tenants.partials.format-script')
@endsection
