<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Log Masuk') — KOJID</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="h-full bg-kojid-slate" x-data>

<div class="absolute top-4 right-4 z-50">
    <div x-data="{ open: false }" class="relative">
        <button @click="open = !open"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            </svg>
            {{ strtoupper(app()->getLocale()) }}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-3 h-3">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        </button>
        <div x-show="open" @click.outside="open = false"
             x-transition
             class="absolute right-0 mt-1 w-28 bg-white rounded-lg shadow-xl border border-slate-100 py-1 z-50">
            <form method="POST" action="{{ route('locale.switch', 'ms') }}">
                @csrf
                <button type="submit"
                        class="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 {{ app()->getLocale() === 'ms' ? 'text-kojid-green font-semibold' : '' }}">
                    🇲🇾 Bahasa Melayu
                </button>
            </form>
            <form method="POST" action="{{ route('locale.switch', 'en') }}">
                @csrf
                <button type="submit"
                        class="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 {{ app()->getLocale() === 'en' ? 'text-kojid-green font-semibold' : '' }}">
                    🇬🇧 English
                </button>
            </form>
        </div>
    </div>
</div>

<div class="min-h-full flex items-center justify-center p-4">
    <div class="w-full max-w-md">

        {{-- Logo --}}
        <div class="text-center mb-8">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-kojid-green shadow-kojid mb-4">
                <span class="text-white font-black text-2xl">K</span>
            </div>
            <h1 class="text-2xl font-bold text-white">KOJID</h1>
            <p class="text-slate-400 text-sm mt-1">Kinetics Food Chain</p>
        </div>

        {{-- Card --}}
        <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div class="px-8 py-6 border-b border-slate-100">
                <h2 class="text-lg font-semibold text-slate-800">@yield('card-title', __('auth.login'))</h2>
            </div>
            <div class="px-8 py-6">
                @yield('content')
            </div>
        </div>

        <p class="text-center text-xs text-slate-500 mt-6">
            &copy; {{ date('Y') }} KOJID — Kinetics Food Chain. 
            {{ __('app.all_rights_reserved') }}
        </p>
    </div>
</div>

</body>
</html>
