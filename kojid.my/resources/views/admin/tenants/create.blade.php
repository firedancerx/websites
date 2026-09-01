@extends('layouts.app')
@section('title', 'Daftar Tenant')

@section('content')
<div class="max-w-3xl mx-auto space-y-6">
    <div class="page-header">
        <div>
            <h1 class="page-title">Daftar Tenant</h1>
            <p class="page-subtitle">Cipta organisasi tenant baharu di platform KOJID</p>
        </div>
        <a href="{{ route('admin.tenants.index') }}" class="btn-secondary btn-sm">Kembali</a>
    </div>

    <form method="POST" action="{{ route('admin.tenants.store') }}" enctype="multipart/form-data">
        @csrf

        <div class="card">
            <div class="card-header">
                <h2 class="font-semibold text-slate-800">Maklumat Tenant</h2>
            </div>
            <div class="card-body grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="form-label">Nama Tenant *</label>
                    <input type="text" name="name" value="{{ old('name') }}" class="form-input" data-title-case required>
                    @error('name')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">Slug *</label>
                    <input type="text" name="slug" value="{{ old('slug') }}" class="form-input" data-slug required placeholder="contoh: syarikat-abc">
                    @error('slug')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">E-mel Hubungan *</label>
                    <input type="email" name="contact_email" value="{{ old('contact_email') }}" class="form-input" required>
                    @error('contact_email')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">Telefon</label>
                    <input type="text" name="contact_phone" value="{{ old('contact_phone') }}" class="form-input" data-phone-dash>
                    @error('contact_phone')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">No. SSM</label>
                    <input type="text" name="ssm_number" value="{{ old('ssm_number') }}" class="form-input" data-upper-case>
                    @error('ssm_number')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div>
                    <label class="form-label">Domain</label>
                    <input type="text" name="domain" value="{{ old('domain') }}" class="form-input" placeholder="contoh: tenant.kojid.my">
                    @error('domain')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4 mt-2">
                    <h3 class="md:col-span-2 font-semibold text-slate-700">Alamat Perniagaan (Business Address)</h3>
                    
                    <div class="md:col-span-2">
                        <label class="form-label">Alamat Baris 1 *</label>
                        <input type="text" name="address_line1" value="{{ old('address_line1') }}" class="form-input" required placeholder="No. Rumah, Jalan / Lorong">
                        @error('address_line1')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div class="md:col-span-2">
                        <label class="form-label">Alamat Baris 2</label>
                        <input type="text" name="address_line2" value="{{ old('address_line2') }}" class="form-input" placeholder="Taman, Seksyen, Kampung">
                        @error('address_line2')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div class="md:col-span-2">
                        <label class="form-label">Alamat Baris 3</label>
                        <input type="text" name="address_line3" value="{{ old('address_line3') }}" class="form-input" placeholder="Bangunan, Tingkat, Unit">
                        @error('address_line3')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">Poskod *</label>
                        <input type="text" name="postcode" value="{{ old('postcode') }}" class="form-input" required maxlength="5" placeholder="contoh: 50000">
                        @error('postcode')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">Bandar *</label>
                        <input type="text" name="town" value="{{ old('town') }}" class="form-input" required placeholder="contoh: Kuala Lumpur">
                        @error('town')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">Negeri *</label>
                        <select name="state" class="form-input" required>
                            <option value="">-- Pilih Negeri --</option>
                            @foreach([
                                'Kuala Lumpur', 'Selangor', 'Johor', 'Penang', 'Perak', 'Kedah', 
                                'Kelantan', 'Terengganu', 'Pahang', 'Negeri Sembilan', 'Melaka', 
                                'Perlis', 'Sabah', 'Sarawak', 'Labuan', 'Putrajaya'
                            ] as $stateOpt)
                                <option value="{{ $stateOpt }}" {{ old('state') === $stateOpt ? 'selected' : '' }}>{{ $stateOpt }}</option>
                            @endforeach
                        </select>
                        @error('state')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">Negara *</label>
                        <select name="country" class="form-input" required>
                            <option value="">-- Pilih Negara --</option>
                            <option value="Malaysia" {{ old('country', 'Malaysia') === 'Malaysia' ? 'selected' : '' }}>Malaysia</option>
                            <option value="Singapore" {{ old('country') === 'Singapore' ? 'selected' : '' }}>Singapore</option>
                            <option value="Indonesia" {{ old('country') === 'Indonesia' ? 'selected' : '' }}>Indonesia</option>
                            <option value="Thailand" {{ old('country') === 'Thailand' ? 'selected' : '' }}>Thailand</option>
                            <option value="Brunei" {{ old('country') === 'Brunei' ? 'selected' : '' }}>Brunei</option>
                        </select>
                        @error('country')<p class="form-error">{{ $message }}</p>@enderror
                    </div>
                </div>

                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4 mt-2">
                    <h3 class="md:col-span-2 font-semibold text-slate-700">Pengesahan Laluan (Password Checks)</h3>
                    
                    <div>
                        <label class="form-label">Kata Laluan *</label>
                        <input type="password" name="password" class="form-input" required placeholder="Minimum 8 aksara">
                        @error('password')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">Sahkan Kata Laluan *</label>
                        <input type="password" name="password_confirmation" class="form-input" required placeholder="Masukkan semula kata laluan">
                        @error('password_confirmation')<p class="form-error">{{ $message }}</p>@enderror
                    </div>
                </div>

                <div class="md:col-span-2 space-y-2 border-t border-slate-100 pt-4">
                    <label class="form-label font-semibold text-slate-700">Peranan Utama Tenant (Single Tenant Role) *</label>
                    <p class="text-xs text-slate-500 mb-2">Setiap tenant wajib mempunyai **HANYA SATU PERANAN UTAMA** di dalam ekosistem platform.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                        <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none p-3 rounded-xl hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="tenant_type" value="actual_supplier" class="text-emerald-600 focus:ring-emerald-500" {{ old('tenant_type', 'actual_supplier') === 'actual_supplier' ? 'checked' : '' }} required>
                            <div>
                                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <x-icon name="truck" class="w-4 h-4 text-emerald-600"/>
                                    Pembekal Fizikal (Actual Seller)
                                </span>
                                <span class="block text-xs text-slate-500">Pengeluar / Pembekal Barangan Fizikal (AS)</span>
                            </div>
                        </label>

                        <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none p-3 rounded-xl hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="tenant_type" value="virtual_seller" class="text-emerald-600 focus:ring-emerald-500" {{ old('tenant_type') === 'virtual_seller' ? 'checked' : '' }} required>
                            <div>
                                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <x-icon name="receipt-percent" class="w-4 h-4 text-indigo-600"/>
                                    Pembekal Maya (Virtual Seller)
                                </span>
                                <span class="block text-xs text-slate-500">Pemegang & Pelepas Kuota Komoditi (VS)</span>
                            </div>
                        </label>

                        <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none p-3 rounded-xl hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="tenant_type" value="standard_buyer" class="text-emerald-600 focus:ring-emerald-500" {{ old('tenant_type') === 'standard_buyer' ? 'checked' : '' }} required>
                            <div>
                                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <x-icon name="shopping-bag" class="w-4 h-4 text-blue-600"/>
                                    Pembeli Fizikal (Actual Buyer)
                                </span>
                                <span class="block text-xs text-slate-500">Pembeli Komersial Komoditi (AB)</span>
                            </div>
                        </label>

                        <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none p-3 rounded-xl hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="tenant_type" value="buyer_with_quota" class="text-emerald-600 focus:ring-emerald-500" {{ old('tenant_type') === 'buyer_with_quota' ? 'checked' : '' }} required>
                            <div>
                                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <x-icon name="ticket" class="w-4 h-4 text-amber-600"/>
                                    Pembeli Maya (Virtual Buyer)
                                </span>
                                <span class="block text-xs text-slate-500">Pembeli Tertakluk Had Kuota (VB)</span>
                            </div>
                        </label>

                        <label class="flex items-center gap-3 text-sm text-slate-700 cursor-pointer select-none p-3 rounded-xl hover:bg-slate-50 border border-slate-200 md:col-span-2">
                            <input type="radio" name="tenant_type" value="auditor" class="text-emerald-600 focus:ring-emerald-500" {{ old('tenant_type') === 'auditor' ? 'checked' : '' }} required>
                            <div>
                                <span class="font-bold text-slate-900 flex items-center gap-1.5">
                                    <x-icon name="shield-check" class="w-4 h-4 text-purple-600"/>
                                    Juruaudit (Auditor)
                                </span>
                                <span class="block text-xs text-slate-500">Pegawai Pematuhan & Semakan Ekosistem (Read-Only)</span>
                            </div>
                        </label>
                    </div>
                    @error('tenant_type')<p class="form-error">{{ $message }}</p>@enderror
                </div>

                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-slate-100 pt-4 mt-2">
                    <h3 class="md:col-span-2 font-semibold text-slate-700">Hierarki Kumpulan (Master Mediator Parent)</h3>
                    
                    <div>
                        <label class="form-label">Master Mediator Parent *</label>
                        <select name="parent_id" class="form-input" required>
                            <option value="">-- Pilih Master Mediator --</option>
                            @foreach(\App\Models\Tenant::whereJsonContains('tenant_types', 'mediator')->get() as $p)
                                <option value="{{ $p->id }}" {{ old('parent_id') == $p->id ? 'selected' : '' }}>{{ $p->name }}</option>
                            @endforeach
                        </select>
                        @error('parent_id')<p class="form-error">{{ $message }}</p>@enderror
                    </div>

                    <div>
                        <label class="form-label">Tema Visual (Theme Style)</label>
                        <select name="settings[branding][ui_template]" class="form-input">
                            <option value="slate" {{ old('settings.branding.ui_template') === 'slate' ? 'selected' : '' }}>Default Slate</option>
                            <option value="emerald" {{ old('settings.branding.ui_template') === 'emerald' ? 'selected' : '' }}>Emerald Corporate</option>
                            <option value="amber" {{ old('settings.branding.ui_template') === 'amber' ? 'selected' : '' }}>Amber Minimalist</option>
                            <option value="midnight" {{ old('settings.branding.ui_template') === 'midnight' ? 'selected' : '' }}>Midnight Dark</option>
                        </select>
                    </div>

                    <div class="md:col-span-2">
                        <label class="form-label">Logo Organisasi (Format Fail Gambar)</label>
                        <input type="file" name="logo_file" class="form-input">
                        <p class="text-xs text-slate-500 mt-1">Sokongan: PNG, JPG, JPEG (Max 2MB).</p>
                    </div>
                </div>

                <div class="md:col-span-2 space-y-2 border-t border-slate-100 pt-4">
                    <label class="form-label font-semibold text-slate-700">Status Pendaftaran (Registration Status)</label>
                    <p class="text-xs text-slate-500 mb-2">Pilih status pendaftaran untuk tenant ini.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
                        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none p-2 rounded hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="status" value="dummy" class="border-slate-300 text-kojid-green focus:ring-kojid-green" {{ old('status') === 'dummy' ? 'checked' : '' }}>
                            <div>
                                <span class="font-medium text-slate-800">Ujian (Dummy)</span>
                                <span class="block text-xs text-slate-500">Hanya untuk ujian</span>
                            </div>
                        </label>
                        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none p-2 rounded hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="status" value="provisional" class="border-slate-300 text-kojid-green focus:ring-kojid-green" {{ old('status', 'provisional') === 'provisional' ? 'checked' : '' }}>
                            <div>
                                <span class="font-medium text-slate-800">Sementara (Provisional)</span>
                                <span class="block text-xs text-slate-500">Akses sementara</span>
                            </div>
                        </label>
                        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none p-2 rounded hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="status" value="permanent" class="border-slate-300 text-kojid-green focus:ring-kojid-green" {{ old('status') === 'permanent' ? 'checked' : '' }}>
                            <div>
                                <span class="font-medium text-slate-800">Kekal (Permanent)</span>
                                <span class="block text-xs text-slate-500">Aktif & disahkan</span>
                            </div>
                        </label>
                        <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none p-2 rounded hover:bg-slate-50 border border-slate-200">
                            <input type="radio" name="status" value="suspended" class="border-slate-300 text-kojid-green focus:ring-kojid-green" {{ old('status') === 'suspended' ? 'checked' : '' }}>
                            <div>
                                <span class="font-medium text-slate-800">Digantung (Suspended)</span>
                                <span class="block text-xs text-slate-500">Akses dibekukan</span>
                            </div>
                        </label>
                    </div>
                    @error('status')<p class="form-error">{{ $message }}</p>@enderror
                </div>
            </div>
        </div>

        <div class="flex justify-end gap-3 pt-2">
            <a href="{{ route('admin.tenants.index') }}" class="btn-secondary">Batal</a>
            <button type="submit" class="btn-primary">
                <x-icon name="plus" class="w-4 h-4"/>
                Daftar Tenant
            </button>
        </div>
    </form>
</div>

@include('admin.tenants.partials.format-script')
@endsection
