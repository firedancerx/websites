<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'KOJID') — Kinetics Food Chain</title>
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    
    {{-- Dynamic Tenant branding styling variables overrides --}}
    @if(isset($currentTenant))
        @php
            $template = $currentTenant->getUiTemplate();
            $colors = match($template) {
                'emerald' => [
                    'green' => '#047857',
                    'slate' => '#064e3b',
                ],
                'amber' => [
                    'green' => '#d97706',
                    'slate' => '#451a03',
                ],
                'midnight' => [
                    'green' => '#2563eb',
                    'slate' => '#0f172a',
                ],
                default => [ // slate
                    'green' => '#16a34a',
                    'slate' => '#1e293b',
                ]
            };
        @endphp
        <style>
            :root {
                --kojid-green: {{ $colors['green'] }} !important;
                --kojid-slate: {{ $colors['slate'] }} !important;
            }
        </style>
    @endif
    
    @stack('head')
</head>
<body class="h-full bg-slate-100" x-data>

{{-- ── Sidebar ──────────────────────────────────────────────────────────── --}}
<div class="flex h-full">

    {{-- Mobile overlay --}}
    <div x-show="$store.sidebar.open"
         x-transition.opacity
         @click="$store.sidebar.close()"
         class="fixed inset-0 z-30 bg-black/40 lg:hidden">
    </div>

    {{-- Sidebar panel --}}
    <aside class="sidebar"
           :class="$store.sidebar.open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">

        {{-- Logo --}}
        <div class="flex items-center gap-3 px-5 py-5 border-b border-white/10 overflow-hidden">
            @if(isset($currentTenant) && $currentTenant->getBrandingLogo())
                <div class="w-10 h-10 rounded-lg overflow-hidden bg-white p-1 shrink-0">
                    <img src="{{ asset('storage/' . $currentTenant->getBrandingLogo()) }}" alt="Logo" class="w-full h-full object-contain">
                </div>
            @else
                <div class="w-8 h-8 rounded-lg bg-kojid-green flex items-center justify-center shrink-0">
                    <span class="text-white font-black text-sm">K</span>
                </div>
            @endif
            <div class="min-w-0 flex-1 overflow-hidden">
                <div class="text-white font-bold text-sm leading-tight break-words line-clamp-2 max-w-[170px]" title="{{ isset($currentTenant) ? $currentTenant->name : 'KOJID' }}">{{ isset($currentTenant) ? $currentTenant->name : 'KOJID' }}</div>
                <div class="text-slate-400 text-xs truncate">Kinetics Food Chain</div>
            </div>
        </div>

        {{-- Tenant badge --}}
        @if(isset($currentTenant))
        <div class="mx-4 mt-3 px-3 py-2 bg-white/5 rounded-lg border border-white/10 overflow-hidden">
            <div class="text-xs text-slate-400">{{ __('app.tenant') }}</div>
            <div class="text-sm text-white font-medium break-words line-clamp-2 min-w-0" title="{{ $currentTenant->name }}">{{ $currentTenant->name }}</div>
        </div>
        @endif

        {{-- Navigation --}}
        <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
            @php
                $menuItems = \App\Services\NavigationMenuService::getMenuForUser(auth()->user(), $currentTenant ?? null);
                $userRole = \App\Services\NavigationMenuService::resolveRole(auth()->user(), $currentTenant ?? auth()->user()->tenant ?? null);
            @endphp

            {{-- Role Indicator Badge --}}
            <div class="px-3 py-2 mb-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                <div class="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Peranan / Role:</div>
                <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    {{ str_replace('_', ' ', $userRole) }}
                </div>
            </div>

            @foreach($menuItems as $item)
                @if(isset($item['label']))
                    <a href="{{ Route::has($item['route']) ? route($item['route']) : '#' }}"
                       class="sidebar-link {{ request()->routeIs($item['route']) ? 'active' : '' }}">
                        <x-icon name="{{ $item['icon'] }}" class="w-4 h-4 shrink-0"/>
                        <span class="flex-1 truncate">{{ $item['label'] }}</span>
                        @if(isset($item['badge']) && $item['badge'] > 0)
                            <span class="px-2 py-0.5 text-xs font-bold bg-amber-500 text-slate-900 rounded-full shrink-0">
                                {{ $item['badge'] }}
                            </span>
                        @endif
                    </a>
                    @if(isset($item['note']))
                        <div class="ml-7 text-[10px] text-amber-400 italic font-medium -mt-1 mb-1">
                            * {{ $item['note'] }}
                        </div>
                    @endif
                @endif
            @endforeach
        </nav>

        {{-- User profile footer --}}
        <div class="border-t border-white/10 px-4 py-4">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-kojid-green/30 flex items-center justify-center">
                    <span class="text-kojid-green font-semibold text-xs">
                        {{ strtoupper(substr(auth()->user()->name, 0, 2)) }}
                    </span>
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-xs text-white font-medium truncate">{{ auth()->user()->name }}</div>
                    <div class="text-xs text-slate-400 truncate">{{ auth()->user()->email }}</div>
                </div>
                <form method="POST" action="{{ route('logout') }}">
                    @csrf
                    <button type="submit" class="text-slate-400 hover:text-white transition-colors p-1" title="{{ __('auth.logout') }}">
                        <x-icon name="arrow-right-on-rectangle" class="w-4 h-4"/>
                    </button>
                </form>
            </div>
        </div>
    </aside>

    {{-- ── Main content ─────────────────────────────────────────────────────── --}}
    <div class="flex-1 flex flex-col min-w-0 lg:pl-64">

        {{-- Impersonation banner --}}
        @if(\App\Services\TenantContextService::isImpersonating() && isset($currentTenant))
            @php
                $superAdminUser = \App\Models\User::where('email', 'superadmin@kojid.com.my')->first();
                $superAdminName = $superAdminUser ? $superAdminUser->name : 'KOJID Platform Root Super Admin';
                $isMs = app()->getLocale() === 'ms';
            @endphp
            <div class="bg-amber-500 text-amber-950 px-6 py-2.5 flex items-center justify-between text-xs font-bold shadow-sm border-b border-amber-600/20 shrink-0">
                <div class="flex items-center gap-2">
                    <x-icon name="user-circle" class="w-4 h-4 shrink-0 text-amber-900"/>
                    <span>{{ $isMs ? 'Sedang melihat sebagai Organisasi: ' . $currentTenant->name : 'Viewing as Organisation: ' . $currentTenant->name }}</span>
                </div>
                <form method="POST" action="{{ route('admin.tenants.exit-impersonate') }}" class="m-0">
                    @csrf
                    <button type="submit" 
                            style="background-color: #451a03; color: #ffffff; padding: 6px 14px; border-radius: 6px; font-weight: 800; font-size: 11px; border: 1px solid #78350f; cursor: pointer;"
                            class="bg-amber-950 hover:bg-amber-900 text-white px-3 py-1.5 rounded-md transition-colors text-xs font-bold flex items-center gap-1">
                        <x-icon name="arrow-left-on-rectangle" class="w-4 h-4 text-amber-300"/>
                        <span>{{ $isMs ? 'Kembali sebagai ' . $superAdminName : 'Return as ' . $superAdminName }}</span>
                    </button>
                </form>
            </div>
        @endif

        {{-- Topbar --}}
        @include('components.topbar')

        {{-- Flash messages --}}
        <div class="px-6 pt-4 space-y-2">
            @foreach(['success','error','warning','info'] as $type)
                @if(session($type))
                    <div x-data="flash()" x-show="show" x-transition.opacity
                         class="alert-{{ $type === 'error' ? 'danger' : $type }}">
                        <x-icon name="{{ $type === 'success' ? 'check-circle' : ($type === 'error' || $type === 'danger' ? 'x-circle' : 'information-circle') }}" class="w-4 h-4 shrink-0 mt-0.5"/>
                        {{ session($type) }}
                    </div>
                @endif
            @endforeach

            @if(isset($errors) && $errors->any())
                <div class="alert-danger">
                    <x-icon name="exclamation-triangle" class="w-4 h-4 shrink-0 mt-0.5"/>
                    <ul class="list-disc list-inside space-y-0.5">
                        @foreach($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif
        </div>

        {{-- Page content --}}
        <main class="flex-1 px-6 py-6">
            @yield('content')
        </main>

        {{-- Footer --}}
        <footer class="px-6 py-4 border-t border-slate-200 text-center text-xs text-slate-400">
            KOJID &copy; {{ date('Y') }} — Kinetics Food Chain. 
            {{ __('app.all_times_myt') }}
        </footer>
    </div>
</div>

@stack('scripts')
<script>
document.addEventListener('DOMContentLoaded', function() {
    function initTableSorting() {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            const thList = table.querySelectorAll('thead th');
            const tbody = table.querySelector('tbody');
            if (!tbody || thList.length === 0) return;

            thList.forEach((th, colIndex) => {
                if (th.textContent.trim() === '' && !th.querySelector('span')) return;
                if (th.dataset.sortInitialized) return;
                th.dataset.sortInitialized = "true";

                th.style.cursor = 'pointer';
                th.style.userSelect = 'none';

                const arrowSpan = document.createElement('span');
                arrowSpan.className = 'inline-flex items-center ml-1 opacity-70 hover:opacity-100 text-[10px] font-mono text-emerald-600 transition-all';
                arrowSpan.innerHTML = '▲▼';
                th.appendChild(arrowSpan);

                let asc = true;

                th.addEventListener('click', function(e) {
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;

                    const allRows = Array.from(tbody.querySelectorAll('tr'));
                    if (allRows.length === 0) return;

                    thList.forEach(otherTh => {
                        const otherSpan = otherTh.querySelector('.inline-flex');
                        if (otherSpan) otherSpan.innerHTML = '▲▼';
                    });

                    arrowSpan.innerHTML = asc ? '▲' : '▼';

                    let parentRows = [];
                    let childRows = [];

                    allRows.forEach(row => {
                        if (row.classList.contains('bg-slate-50/90') || row.querySelector('.bg-emerald-700')) {
                            parentRows.push(row);
                        } else {
                            childRows.push(row);
                        }
                    });

                    const getValue = (row, index) => {
                        const cell = row.children[index];
                        if (!cell) return '';
                        return cell.textContent.trim().toLowerCase();
                    };

                    const sortFn = (a, b) => {
                        const valA = getValue(a, colIndex);
                        const valB = getValue(b, colIndex);

                        const numA = parseFloat(valA.replace(/[^0-9.-]+/g, ''));
                        const numB = parseFloat(valB.replace(/[^0-9.-]+/g, ''));

                        if (!isNaN(numA) && !isNaN(numB) && valA.match(/^[RM$]?\s*[-+]?\d/i)) {
                            return asc ? numA - numB : numB - numA;
                        }
                        return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
                    };

                    if (parentRows.length > 0) {
                        childRows.sort(sortFn);
                        parentRows.forEach(pRow => tbody.appendChild(pRow));
                        childRows.forEach(cRow => tbody.appendChild(cRow));
                    } else {
                        allRows.sort(sortFn);
                        allRows.forEach(row => tbody.appendChild(row));
                    }

                    asc = !asc;
                });
            });
        });
    }

    initTableSorting();
    window.initTableSorting = initTableSorting;
});
</script>
</body>
</html>
