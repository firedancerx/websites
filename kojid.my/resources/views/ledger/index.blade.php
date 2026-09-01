{{-- resources/views/ledger/index.blade.php --}}
@extends('layouts.app')
@section('title', __('ledger.title'))

@section('content')
<div class="space-y-4">
    <div class="page-header">
        <div>
            <h1 class="page-title">{{ __('ledger.title') }}</h1>
            <p class="page-subtitle">{{ __('ledger.subtitle') }}</p>
        </div>
        <a href="{{ route('ledger.trial-balance') }}" class="btn-secondary btn-sm">
            <x-icon name="scale" class="w-4 h-4"/>
            {{ __('ledger.trial_balance') }}
        </a>
    </div>

    <form method="GET" class="flex flex-wrap gap-3 items-end">
        <div>
            <label class="form-label">{{ __('ledger.account') }}</label>
            <select name="account" class="form-select">
                <option value="">{{ __('app.all') }}</option>
                @foreach(config('kojid.accounts') as $code => $name)
                    <option value="{{ $code }}" {{ request('account') === $code ? 'selected' : '' }}>
                        {{ $code }} — {{ $name }}
                    </option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="form-label">{{ __('app.from') }}</label>
            <input type="date" name="from" value="{{ request('from') }}" class="form-input">
        </div>
        <div>
            <label class="form-label">{{ __('app.to') }}</label>
            <input type="date" name="to" value="{{ request('to') }}" class="form-input">
        </div>
        <div>
            <label class="form-label">{{ __('ledger.reference') }}</label>
            <input type="text" name="ref" value="{{ request('ref') }}" class="form-input w-40"
                   placeholder="e.g. DEP-123">
        </div>
        <button type="submit" class="btn-secondary">
            <x-icon name="arrow-path" class="w-4 h-4"/> {{ __('app.filter') }}
        </button>
        <a href="{{ route('ledger.trial-balance', ['format' => 'pdf']) }}" class="btn-secondary btn-sm">
            <x-icon name="document-arrow-down" class="w-4 h-4"/> PDF
        </a>
    </form>

    <div class="card">
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>{{ __('ledger.posted_at') }}</th>
                        <th>{{ __('ledger.reference') }}</th>
                        <th>{{ __('ledger.account') }}</th>
                        <th>{{ __('ledger.narrative') }}</th>
                        <th class="text-right">{{ __('ledger.debit') }}</th>
                        <th class="text-right">{{ __('ledger.credit') }}</th>
                        <th>{{ __('ledger.initiated_by') }}</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($entries as $entry)
                    <tr>
                        <td class="font-mono text-xs text-slate-500">
                            {{ $entry->posted_at->setTimezone('Asia/Kuala_Lumpur')->format('d M Y H:i') }}
                        </td>
                        <td class="font-mono text-xs text-kojid-green">{{ $entry->transaction_ref }}</td>
                        <td>
                            <span class="font-mono text-xs font-semibold">{{ $entry->account_code }}</span>
                            <span class="text-xs text-slate-500 ml-1">{{ $entry->getAccountName() }}</span>
                        </td>
                        <td class="text-xs text-slate-600 max-w-xs truncate">{{ $entry->narrative }}</td>
                        <td class="text-right font-mono text-sm">
                            @if($entry->dr_amount > 0)
                                <x-money :amount="$entry->dr_amount"/>
                            @else
                                <span class="text-slate-300">—</span>
                            @endif
                        </td>
                        <td class="text-right font-mono text-sm">
                            @if($entry->cr_amount > 0)
                                <x-money :amount="$entry->cr_amount"/>
                            @else
                                <span class="text-slate-300">—</span>
                            @endif
                        </td>
                        <td class="text-xs text-slate-500">{{ $entry->initiatedBy?->name ?? 'System' }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="7" class="text-center py-12 text-slate-400">{{ __('ledger.no_entries') }}</td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        @if($entries->hasPages())
        <div class="px-6 py-4 border-t border-slate-100">{{ $entries->links() }}</div>
        @endif
    </div>
</div>
@endsection
