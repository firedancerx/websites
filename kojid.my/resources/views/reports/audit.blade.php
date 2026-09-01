@extends('layouts.app')
@section('title', 'Log Audit')

@section('content')
<div class="space-y-5">
    <div class="page-header">
        <div>
            <h1 class="page-title flex items-center gap-2">
                <x-icon name="clipboard-document-list" class="w-6 h-6 text-slate-500"/>
                Log Audit
            </h1>
            <p class="page-subtitle">Jejak audit dan log aktiviti sistem</p>
        </div>
    </div>

    {{-- Filter Bar --}}
    <form method="GET" class="flex flex-wrap gap-3 items-end">
        <div>
            <label class="form-label">Pengguna</label>
            <select name="causer_id" class="form-select w-48">
                <option value="">{{ __('app.all') }}</option>
                @foreach($activities->pluck('causer')->unique('id')->filter() as $causer)
                    <option value="{{ $causer->id }}" {{ request('causer_id') == $causer->id ? 'selected' : '' }}>
                        {{ $causer->name }}
                    </option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="form-label">Jenis Subjek</label>
            <select name="subject_type" class="form-select w-48">
                <option value="">{{ __('app.all') }}</option>
                @foreach($activities->pluck('subject_type')->unique()->filter() as $type)
                    <option value="{{ $type }}" {{ request('subject_type') === $type ? 'selected' : '' }}>
                        {{ class_basename($type) }}
                    </option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="form-label">Dari Tarikh</label>
            <input type="date" name="from" value="{{ request('from') }}" class="form-input">
        </div>
        <div>
            <label class="form-label">Hingga Tarikh</label>
            <input type="date" name="to" value="{{ request('to') }}" class="form-input">
        </div>
        <button type="submit" class="btn-secondary">
            <x-icon name="arrow-path" class="w-4 h-4"/> {{ __('app.filter') }}
        </button>
    </form>

    {{-- Activities Table --}}
    <div class="card">
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Cap Masa</th>
                        <th>Pengguna</th>
                        <th>Tindakan</th>
                        <th>Subjek</th>
                        <th>Keterangan</th>
                        <th>Sifat</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($activities as $activity)
                    <tr x-data="{ open: false }">
                        <td class="text-sm text-slate-500 whitespace-nowrap">
                            {{ $activity->created_at->setTimezone('Asia/Kuala_Lumpur')->format('d M Y H:i:s') }}
                        </td>
                        <td class="font-medium text-slate-800">{{ $activity->causer?->name ?? 'Sistem' }}</td>
                        <td>
                            <span class="badge {{ $activity->event === 'created' ? 'badge-green' : ($activity->event === 'deleted' ? 'badge-red' : 'badge-slate') }}">
                                {{ $activity->event ?? $activity->description }}
                            </span>
                        </td>
                        <td class="text-sm text-slate-600">
                            @if($activity->subject_type)
                                {{ class_basename($activity->subject_type) }}
                                <span class="text-slate-400 font-mono">#{{ $activity->subject_id }}</span>
                            @else
                                —
                            @endif
                        </td>
                        <td class="text-sm text-slate-600 max-w-xs truncate">{{ $activity->description }}</td>
                        <td>
                            @if($activity->properties && $activity->properties->count())
                                <button @click="open = !open" class="btn-ghost btn-sm text-xs">
                                    <x-icon name="code-bracket" class="w-4 h-4"/>
                                    <span x-text="open ? 'Tutup' : 'Lihat'"></span>
                                </button>
                            @else
                                <span class="text-slate-300 text-xs">—</span>
                            @endif
                        </td>
                    </tr>
                    @if($activity->properties && $activity->properties->count())
                    <tr x-data x-show="$el.previousElementSibling.__x_dataStack?.[0]?.open"
                        x-transition x-cloak>
                        <td colspan="6" class="bg-slate-50 p-4">
                            <pre class="text-xs text-slate-700 overflow-x-auto max-h-48">{{ json_encode($activity->properties->toArray(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) }}</pre>
                        </td>
                    </tr>
                    @endif
                    @empty
                    <tr>
                        <td colspan="6" class="text-center py-12 text-slate-400">Tiada log aktiviti</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($activities->hasPages())
        <div class="px-6 py-4 border-t border-slate-100">{{ $activities->links() }}</div>
        @endif
    </div>
</div>
@endsection
