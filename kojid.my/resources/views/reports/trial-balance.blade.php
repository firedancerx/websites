@extends('layouts.app')
@section('title', __('reports.trial_balance'))

@section('content')
<div class="space-y-5">
    <div class="page-header">
        <div>
            <h1 class="page-title">{{ __('reports.trial_balance') }}</h1>
            <p class="page-subtitle">
                {{ __('reports.as_of') }}: {{ $asOf ? $asOf->setTimezone('Asia/Kuala_Lumpur')->format('d M Y') : __('reports.today') }}
            </p>
        </div>
        <div class="flex gap-2">
            <a href="{{ route('reports.trial-balance', array_merge(request()->all(), ['format' => 'pdf'])) }}"
               class="btn-secondary btn-sm">
                <x-icon name="document-arrow-down" class="w-4 h-4"/> PDF
            </a>
        </div>
    </div>

    {{-- Working Capital Summary --}}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="kpi-card">
            <div class="kpi-label">{{ __('dashboard.working_capital') }}</div>
            <div class="kpi-value">
                <x-money :amount="$wc['working_capital']->getAmount()->__toString()" :colored="true"/>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">{{ __('dashboard.assets') }}</div>
            <div class="kpi-value text-kojid-green">
                <x-money :amount="$wc['assets']->getAmount()->__toString()"/>
            </div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">{{ __('dashboard.liabilities') }}</div>
            <div class="kpi-value text-kojid-red">
                <x-money :amount="$wc['liabilities']->getAmount()->__toString()"/>
            </div>
        </div>
    </div>

    {{-- Trial Balance Table --}}
    <div class="card">
        <div class="card-header">
            <h2 class="font-semibold text-slate-800">{{ __('reports.all_accounts') }}</h2>
        </div>
        <div class="table-wrap">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>{{ __('ledger.account_code') }}</th>
                        <th>{{ __('ledger.account_name') }}</th>
                        <th class="text-right">{{ __('ledger.total_debit') }}</th>
                        <th class="text-right">{{ __('ledger.total_credit') }}</th>
                        <th class="text-right">{{ __('ledger.net_balance') }}</th>
                    </tr>
                </thead>
                <tbody>
                    @php $grandDr = '0.00'; $grandCr = '0.00'; @endphp
                    @forelse($trialBalance as $row)
                    @php
                        $grandDr = bcadd($grandDr, $row['total_dr'], 2);
                        $grandCr = bcadd($grandCr, $row['total_cr'], 2);
                    @endphp
                    <tr>
                        <td class="font-mono font-semibold text-sm">{{ $row['account_code'] }}</td>
                        <td class="text-slate-700">{{ $row['name'] }}</td>
                        <td class="text-right font-mono text-sm"><x-money :amount="$row['total_dr']"/></td>
                        <td class="text-right font-mono text-sm"><x-money :amount="$row['total_cr']"/></td>
                        <td class="text-right font-mono font-semibold">
                            <x-money :amount="$row['net']" :colored="true"/>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="text-center py-8 text-slate-400">{{ __('reports.no_entries') }}</td>
                    </tr>
                    @endforelse
                </tbody>
                <tfoot class="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <tr>
                        <td colspan="2" class="px-4 py-3 text-slate-800">{{ __('reports.totals') }}</td>
                        <td class="px-4 py-3 text-right font-mono"><x-money :amount="$grandDr"/></td>
                        <td class="px-4 py-3 text-right font-mono"><x-money :amount="$grandCr"/></td>
                        <td class="px-4 py-3 text-right font-mono">
                            @php $balanced = bccomp($grandDr, $grandCr, 2) === 0; @endphp
                            @if($balanced)
                                <span class="badge badge-green">{{ __('reports.balanced') }} ✓</span>
                            @else
                                <span class="badge badge-red">{{ __('reports.imbalanced') }} ✗</span>
                            @endif
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
</div>
@endsection
