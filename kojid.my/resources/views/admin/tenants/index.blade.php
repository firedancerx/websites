@extends('layouts.app')
@section('title', app()->getLocale() === 'ms' ? 'Pengurusan Tenant' : 'Tenant Ecosystems')

@section('content')
@php
    $isMs = app()->getLocale() === 'ms';
@endphp
<div class="space-y-6">
    {{-- Header --}}
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
            <h1 class="text-xl font-black text-slate-900 tracking-tight">{{ $isMs ? 'Pengurusan Tenant & Hierarki Mediator' : 'Tenant Ecosystems & Mediator Hierarchy' }}</h1>
            <p class="text-xs text-slate-600 mt-1">{{ $isMs ? 'Senarai akaun Mediator dan subtenant di bawah rangkaian masing-masing' : 'List of Mediator accounts and nested subtenants under their respective downlines' }}</p>
        </div>
        <a href="{{ route('admin.tenants.create') }}" 
           style="background-color: #059669; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; border: 1px solid #047857;"
           class="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm shrink-0">
            <x-icon name="plus" class="w-4 h-4"/>
            <span>{{ $isMs ? 'Daftar Tenant Baharu' : 'Register New Tenant' }}</span>
        </a>
    </div>

    {{-- Loop Through Each Master Mediator Group --}}
    @forelse($tenants as $mediatorIndex => $mediator)
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        
        {{-- Section Title Bar --}}
        <div class="px-4 py-2.5 bg-slate-800 text-white flex items-center justify-between">
            <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 bg-emerald-500 text-slate-950 font-black text-xs rounded-md">
                    M{{ $mediatorIndex + 1 }}
                </span>
                <span class="font-bold text-sm tracking-tight text-white">
                    {{ $isMs ? 'Kumpulan Mediator #' . ($mediatorIndex + 1) : 'Mediator Group #' . ($mediatorIndex + 1) }}
                </span>
                <span class="text-xs text-slate-300 font-normal">
                    ({{ $mediator->children->count() }} {{ $isMs ? 'subtenant' : 'subtenants' }})
                </span>
            </div>
            <span class="text-[11px] font-mono text-emerald-400 font-semibold uppercase">
                1st-Tier Intermediary
            </span>
        </div>

        {{-- Single Compact Table Containing Both Mediator Parent Row & Subtenant Child Rows --}}
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase border-b border-slate-200">
                        <th class="py-2.5 px-4 min-w-[220px]">{{ $isMs ? 'Organisasi / Tenant' : 'Organisation / Tenant' }}</th>
                        <th class="py-2.5 px-3 min-w-[140px]">{{ $isMs ? 'Peranan (Role)' : 'Role Tag' }}</th>
                        <th class="py-2.5 px-3 hidden sm:table-cell">{{ $isMs ? 'No. SSM' : 'SSM Number' }}</th>
                        <th class="py-2.5 px-3">{{ $isMs ? 'Status' : 'Status' }}</th>
                        <th class="py-2.5 px-3 hidden md:table-cell">{{ $isMs ? 'Pengguna / Pesanan' : 'Users / Orders' }}</th>
                        <th class="py-2.5 px-4 text-right min-w-[170px]">{{ $isMs ? 'Tindakan' : 'Actions' }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs">
                    
                    {{-- 1. MEDIATOR PARENT ROW (Visible inside the table) --}}
                    <tr class="bg-slate-50/90 font-bold border-b border-slate-200">
                        {{-- Name --}}
                        <td class="py-3 px-4">
                            <div class="flex items-center gap-2">
                                <span class="px-1.5 py-0.5 bg-emerald-700 text-white text-[10px] font-black rounded">M{{ $mediatorIndex + 1 }}</span>
                                <span class="text-slate-900 font-black text-sm">{{ \Illuminate\Support\Str::title($mediator->name) }}</span>
                            </div>
                        </td>

                        {{-- Role Tag --}}
                        <td class="py-3 px-3">
                            <span class="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded text-xs font-black">
                                Mediator
                            </span>
                        </td>

                        {{-- SSM --}}
                        <td class="py-3 px-3 hidden sm:table-cell font-mono text-xs text-slate-700">
                            {{ $mediator->ssm_number ? \Illuminate\Support\Str::upper($mediator->ssm_number) : '-' }}
                        </td>

                        {{-- Status --}}
                        <td class="py-3 px-3">
                            @php
                                $statusVal = $mediator->status ?? ($mediator->is_active ? 'permanent' : 'suspended');
                            @endphp
                            @if($statusVal === 'suspended')
                                <span class="px-2 py-0.5 bg-red-50 text-red-800 rounded text-[10px] font-bold border border-red-200">{{ $isMs ? 'Digantung' : 'Suspended' }}</span>
                            @else
                                <span class="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold border border-emerald-200">{{ $isMs ? 'Kekal' : 'Permanent' }}</span>
                            @endif
                        </td>

                        {{-- Users / Orders Count --}}
                        <td class="py-3 px-3 hidden md:table-cell font-mono text-xs text-slate-700">
                            {{ $mediator->users_count ?? $mediator->users->count() }} u / {{ $mediator->orders_count ?? $mediator->orders->count() }} p
                        </td>

                        {{-- Actions --}}
                        <td class="py-3 px-4 text-right">
                            <div class="flex items-center gap-1.5 justify-end">
                                <form method="POST" action="{{ route('admin.tenants.impersonate', $mediator) }}" class="m-0">
                                    @csrf
                                    <button type="submit" 
                                            style="background-color: #f1f5f9; color: #0f172a; padding: 4px 8px; border-radius: 5px; font-weight: 700; font-size: 11px; border: 1px solid #cbd5e1; cursor: pointer;"
                                            class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded font-bold text-[11px] transition-colors border border-slate-300">
                                        {{ $isMs ? 'Lihat' : 'View' }}
                                    </button>
                                </form>

                                <a href="{{ route('admin.tenants.edit', $mediator) }}" 
                                   style="background-color: #f1f5f9; color: #0f172a; padding: 4px 8px; border-radius: 5px; font-weight: 700; font-size: 11px; border: 1px solid #cbd5e1; text-decoration: none;"
                                   class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded font-bold text-[11px] transition-colors border border-slate-300">
                                    Edit
                                </a>

                                {{-- Mediator #1 (SuperAdmin Mediator) MUST NOT have Gantung button --}}
                                @if($mediator->id != 1)
                                    @if($mediator->is_active)
                                        <form method="POST" action="{{ route('admin.tenants.suspend', $mediator) }}"
                                              onsubmit="return confirm('{{ $isMs ? 'Gantung mediator' : 'Suspend mediator' }} {{ $mediator->name }}?')" class="m-0">
                                            @csrf
                                            <button type="submit" 
                                                    style="background-color: #fef2f2; color: #991b1b; padding: 4px 8px; border-radius: 5px; font-weight: 700; font-size: 11px; border: 1px solid #fca5a5; cursor: pointer;"
                                                    class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-800 rounded font-bold text-[11px] transition-colors border border-red-200">
                                                {{ $isMs ? 'Gantung' : 'Suspend' }}
                                            </button>
                                        </form>
                                    @else
                                        <form method="POST" action="{{ route('admin.tenants.reactivate', $mediator) }}" class="m-0">
                                            @csrf
                                            <button type="submit" 
                                                    style="background-color: #ecfdf5; color: #065f46; padding: 4px 8px; border-radius: 5px; font-weight: 700; font-size: 11px; border: 1px solid #6ee7b7; cursor: pointer;"
                                                    class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold text-[11px] transition-colors border border-emerald-200">
                                                {{ $isMs ? 'Aktifkan' : 'Reactivate' }}
                                            </button>
                                        </form>
                                    @endif
                                @endif
                            </div>
                        </td>
                    </tr>

                    {{-- 2. NESTED SUBTENANT CHILD ROWS --}}
                    @forelse($mediator->children as $child)
                    @php
                        $roleType = is_array($child->tenant_types) ? ($child->tenant_types[0] ?? 'actual_supplier') : 'actual_supplier';
                        $roleLabel = match($roleType) {
                            'mediator' => 'Mediator',
                            'actual_supplier' => $isMs ? 'Pembekal Fizikal' : 'Actual Seller',
                            'virtual_seller' => $isMs ? 'Pembekal Maya' : 'Virtual Seller',
                            'standard_buyer' => $isMs ? 'Pembeli Fizikal' : 'Actual Buyer',
                            'buyer_with_quota' => $isMs ? 'Pembeli Maya' : 'Virtual Buyer',
                            'auditor' => $isMs ? 'Juruaudit' : 'Auditor',
                            default => $roleType
                        };
                        $roleBadgeStyle = match($roleType) {
                            'actual_supplier' => 'bg-emerald-50 text-emerald-900 border-emerald-300',
                            'virtual_seller' => 'bg-indigo-50 text-indigo-900 border-indigo-300',
                            'standard_buyer' => 'bg-blue-50 text-blue-900 border-blue-300',
                            'buyer_with_quota' => 'bg-amber-50 text-amber-900 border-amber-300',
                            'auditor' => 'bg-purple-50 text-purple-900 border-purple-300',
                            default => 'bg-slate-50 text-slate-800 border-slate-300'
                        };
                    @endphp
                    <tr class="hover:bg-slate-50/80 transition-colors border-l-4 border-emerald-500">
                        {{-- Name --}}
                        <td class="py-2.5 px-4 pl-7">
                            <div class="flex items-center gap-1.5">
                                <span class="text-emerald-600 font-black text-xs">↳</span>
                                <span class="font-bold text-slate-800 text-xs">{{ \Illuminate\Support\Str::title($child->name) }}</span>
                            </div>
                        </td>

                        {{-- Role Tag --}}
                        <td class="py-2.5 px-3">
                            <span class="px-2 py-0.5 rounded text-[11px] font-bold border {{ $roleBadgeStyle }}">
                                {{ $roleLabel }}
                            </span>
                        </td>

                        {{-- SSM --}}
                        <td class="py-2.5 px-3 hidden sm:table-cell font-mono text-xs text-slate-600">
                            {{ $child->ssm_number ? \Illuminate\Support\Str::upper($child->ssm_number) : '-' }}
                        </td>

                        {{-- Status --}}
                        <td class="py-2.5 px-3">
                            @php
                                $statusVal = $child->status ?? ($child->is_active ? 'permanent' : 'suspended');
                            @endphp
                            @if($statusVal === 'dummy')
                                <span class="px-2 py-0.5 bg-blue-50 text-blue-800 rounded text-[10px] font-bold border border-blue-200">{{ $isMs ? 'Ujian' : 'Test' }}</span>
                            @elseif($statusVal === 'provisional')
                                <span class="px-2 py-0.5 bg-amber-50 text-amber-800 rounded text-[10px] font-bold border border-amber-200">{{ $isMs ? 'Sementara' : 'Provisional' }}</span>
                            @elseif($statusVal === 'permanent')
                                <span class="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] font-bold border border-emerald-200">{{ $isMs ? 'Kekal' : 'Permanent' }}</span>
                            @elseif($statusVal === 'suspended')
                                <span class="px-2 py-0.5 bg-red-50 text-red-800 rounded text-[10px] font-bold border border-red-200">{{ $isMs ? 'Digantung' : 'Suspended' }}</span>
                            @else
                                <span class="px-2 py-0.5 bg-slate-50 text-slate-700 rounded text-[10px] font-bold border border-slate-200">{{ $statusVal }}</span>
                            @endif
                        </td>

                        {{-- Users / Orders Count --}}
                        <td class="py-2.5 px-3 hidden md:table-cell font-mono text-xs text-slate-600">
                            {{ $child->users_count ?? $child->users->count() }} / {{ $child->orders_count ?? $child->orders->count() }}
                        </td>

                        {{-- Actions --}}
                        <td class="py-2.5 px-4 text-right">
                            <div class="flex items-center gap-1.5 justify-end">
                                <form method="POST" action="{{ route('admin.tenants.impersonate', $child) }}" class="m-0">
                                    @csrf
                                    <button type="submit" 
                                            style="background-color: #f1f5f9; color: #0f172a; padding: 4px 8px; border-radius: 5px; font-weight: 700; font-size: 11px; border: 1px solid #cbd5e1; cursor: pointer;"
                                            class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded font-bold text-[11px] transition-colors border border-slate-300">
                                        {{ $isMs ? 'Lihat' : 'View' }}
                                    </button>
                                </form>

                                <a href="{{ route('admin.tenants.edit', $child) }}" 
                                   style="background-color: #f1f5f9; color: #0f172a; padding: 4px 8px; border-radius: 5px; font-weight: 700; font-size: 11px; border: 1px solid #cbd5e1; text-decoration: none;"
                                   class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded font-bold text-[11px] transition-colors border border-slate-300">
                                    Edit
                                </a>

                                @if($child->is_active)
                                    <form method="POST" action="{{ route('admin.tenants.suspend', $child) }}"
                                          onsubmit="return confirm('{{ $isMs ? 'Gantung tenant' : 'Suspend tenant' }} {{ $child->name }}?')" class="m-0">
                                        @csrf
                                        <button type="submit" 
                                                style="background-color: #fef2f2; color: #991b1b; padding: 4px 8px; border-radius: 5px; font-weight: 700; font-size: 11px; border: 1px solid #fca5a5; cursor: pointer;"
                                                class="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-800 rounded font-bold text-[11px] transition-colors border border-red-200">
                                            {{ $isMs ? 'Gantung' : 'Suspend' }}
                                        </button>
                                    </form>
                                @else
                                    <form method="POST" action="{{ route('admin.tenants.reactivate', $child) }}" class="m-0">
                                        @csrf
                                        <button type="submit" 
                                                style="background-color: #ecfdf5; color: #065f46; padding: 4px 8px; border-radius: 5px; font-weight: 700; font-size: 11px; border: 1px solid #6ee7b7; cursor: pointer;"
                                                class="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold text-[11px] transition-colors border border-emerald-200">
                                            {{ $isMs ? 'Aktifkan' : 'Reactivate' }}
                                        </button>
                                    </form>
                                @endif
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="6" class="text-center py-6 text-slate-400 text-xs italic">
                            {{ $isMs ? 'Tiada subtenant di bawah Mediator ini' : 'No subtenants under this Master Mediator' }}
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
    @empty
    <div class="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        {{ $isMs ? 'Tiada Master Mediator ditemui di dalam sistem' : 'No Master Mediators found in the system' }}
    </div>
    @endforelse
</div>
@endsection
