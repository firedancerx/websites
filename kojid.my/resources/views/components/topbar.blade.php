<header class="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3">
    <div class="flex items-center justify-between gap-4">

        {{-- Hamburger (mobile) --}}
        <button @click="$store.sidebar.toggle()"
                class="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
            <x-icon name="bars-3" class="w-5 h-5"/>
        </button>

        {{-- Back Button --}}
        <button onclick="window.history.length > 1 ? window.history.back() : window.location.href='{{ route('dashboard') }}'"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm shrink-0"
                title="Back">
            <x-icon name="arrow-left" class="w-3.5 h-3.5"/>
            <span>Back</span>
        </button>

        {{-- Page breadcrumb / title --}}
        <div class="flex-1 hidden sm:block">
            <nav class="flex items-center gap-2 text-xs text-slate-500">
                @if(\App\Services\TenantContextService::isImpersonating())
                    @php
                        $superAdminUser = \App\Models\User::where('email', 'superadmin@kojid.com.my')->first();
                        $superAdminName = $superAdminUser ? $superAdminUser->name : 'KOJID Platform Root Super Admin';
                        $isMs = app()->getLocale() === 'ms';
                    @endphp
                    <form method="POST" action="{{ route('admin.tenants.exit-impersonate') }}" class="m-0 inline-flex items-center">
                        @csrf
                        <button type="submit" class="hover:text-amber-900 font-bold text-amber-950 transition-colors bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded text-[11px] flex items-center gap-1">
                            <span>← {{ $isMs ? 'Kembali sebagai ' . $superAdminName : 'Return as ' . $superAdminName }}</span>
                        </button>
                    </form>
                @else
                    <a href="{{ route('dashboard') }}" class="hover:text-kojid-green transition-colors font-bold">KOJID</a>
                @endif
                @if(View::hasSection('breadcrumb'))
                    <span>/</span>
                    @yield('breadcrumb')
                @endif
            </nav>
        </div>

        <div class="flex items-center gap-2">

            {{-- Language switcher --}}
            <div x-data="{ open: false }" class="relative">
                <button @click="open = !open"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200
                               text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                    <x-icon name="language" class="w-4 h-4"/>
                    {{ strtoupper(app()->getLocale()) }}
                    <x-icon name="chevron-down" class="w-3 h-3"/>
                </button>
                <div x-show="open" @click.outside="open = false"
                     x-transition
                     class="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50">
                    <form method="POST" action="{{ route('locale.switch', 'ms') }}">
                        @csrf
                        <button type="submit"
                                class="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-50 flex items-center gap-2 {{ app()->getLocale() === 'ms' ? 'text-kojid-green font-semibold' : 'text-slate-700' }}">
                            🇲🇾 Bahasa Melayu
                        </button>
                    </form>
                    <form method="POST" action="{{ route('locale.switch', 'en') }}">
                        @csrf
                        <button type="submit"
                                class="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-50 flex items-center gap-2 {{ app()->getLocale() === 'en' ? 'text-kojid-green font-semibold' : 'text-slate-700' }}">
                            🇬🇧 English
                        </button>
                    </form>
                </div>
            </div>

            {{-- Notification bell --}}
            <div x-data="notificationBadge()" class="relative">
                <a href="{{ route('notifications.index') }}"
                   class="relative flex items-center p-2 rounded-lg text-slate-500 hover:bg-slate-100
                          transition-colors">
                    <x-icon name="bell" class="w-5 h-5"/>
                    <span x-show="count > 0"
                          x-text="count > 99 ? '99+' : count"
                          class="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] flex items-center
                                 justify-center bg-kojid-red text-white text-[10px] font-bold rounded-full
                                 px-0.5 leading-none">
                    </span>
                </a>
            </div>

            {{-- User avatar --}}
            @php
                $isImpersonating = \App\Services\TenantContextService::isImpersonating();
                $displayName = ($isImpersonating && isset($currentTenant)) ? $currentTenant->name : auth()->user()->name;
                $displaySubtitle = ($isImpersonating && isset($currentTenant)) 
                    ? (app()->getLocale() === 'ms' ? 'Organisasi Impersonasi' : 'Impersonated Organisation') 
                    : auth()->user()->email;
            @endphp
            <div x-data="{ open: false }" class="relative">
                <button @click="open = !open"
                        class="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                    <div class="w-7 h-7 rounded-full {{ $isImpersonating ? 'bg-amber-500/20' : 'bg-kojid-green/20' }} flex items-center justify-center">
                        <span class="{{ $isImpersonating ? 'text-amber-800' : 'text-kojid-green' }} font-bold text-xs">
                            {{ strtoupper(substr($displayName, 0, 2)) }}
                        </span>
                    </div>
                    <span class="hidden md:block text-sm font-medium text-slate-700 max-w-[140px] truncate">
                        {{ $displayName }}
                    </span>
                    <x-icon name="chevron-down" class="w-3 h-3 text-slate-400"/>
                </button>

                <div x-show="open" @click.outside="open = false"
                     x-transition
                     class="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
                    <div class="px-3 py-2 border-b border-slate-100">
                        <div class="text-xs font-bold text-slate-900 truncate">{{ $displayName }}</div>
                        <div class="text-xs text-slate-500 truncate">{{ $displaySubtitle }}</div>
                        @if($isImpersonating)
                            <span class="mt-1 inline-block px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] font-black uppercase">
                                IMPERSONATING
                            </span>
                        @endif
                    </div>

                    <div class="py-1 border-b border-slate-100">
                        <a href="{{ route('profile') }}" 
                           class="w-full px-3 py-2 text-xs text-left text-slate-800 hover:bg-slate-100 flex items-center gap-2 transition-colors font-bold">
                            <x-icon name="user-circle" class="w-4 h-4 text-emerald-600 shrink-0"/>
                            <span>{{ app()->getLocale() === 'ms' ? 'Profil & Akaun Saya' : 'My Account & Profile' }}</span>
                        </a>
                    </div>

                    @if($isImpersonating)
                        @php
                            $superAdminUser = \App\Models\User::where('email', 'superadmin@kojid.com.my')->first();
                            $superAdminName = $superAdminUser ? $superAdminUser->name : 'KOJID Platform Root Super Admin';
                            $isMs = app()->getLocale() === 'ms';
                        @endphp
                        <form method="POST" action="{{ route('admin.tenants.exit-impersonate') }}" class="m-0 border-b border-slate-100">
                            @csrf
                            <button type="submit"
                                    class="w-full px-3 py-2 text-xs text-left text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-2 transition-colors font-bold">
                                <x-icon name="arrow-left-on-rectangle" class="w-4 h-4 text-amber-700 shrink-0"/>
                                <span>{{ $isMs ? 'Kembali sebagai ' . $superAdminName : 'Return as ' . $superAdminName }}</span>
                            </button>
                        </form>
                    @endif

                    <form method="POST" action="{{ route('logout') }}" class="mt-1">
                        @csrf
                        <button type="submit"
                                class="w-full px-3 py-2 text-xs text-left text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-bold">
                            <x-icon name="arrow-right-on-rectangle" class="w-4 h-4 shrink-0"/>
                            {{ __('auth.logout') }}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
</header>
