{{-- resources/views/components/dof-indicator.blade.php --}}
{{-- Days of Freshness traffic light. M6 (future phase) placeholder. --}}
@props(['daysRemaining', 'totalDays'])

@php
if (!$totalDays || !$daysRemaining) {
    $pct = null;
} else {
    $pct = ($daysRemaining / $totalDays) * 100;
}

[$bg, $text, $label] = match(true) {
    $pct === null   => ['bg-slate-200',  'text-slate-500',   '—'],
    $pct <= 0       => ['bg-black',      'text-white',       __('orders.dof.expired')],
    $pct < 30       => ['bg-red-100',    'text-red-700',     $daysRemaining . 'd'],
    $pct < 60       => ['bg-amber-100',  'text-amber-700',   $daysRemaining . 'd'],
    default         => ['bg-green-100',  'text-green-700',   $daysRemaining . 'd'],
};
@endphp

<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold {{ $bg }} {{ $text }}">
    <span class="w-1.5 h-1.5 rounded-full
        {{ $pct === null ? 'bg-slate-400' : ($pct <= 0 ? 'bg-black' : ($pct < 30 ? 'bg-red-500' : ($pct < 60 ? 'bg-amber-500' : 'bg-green-500'))) }}">
    </span>
    DoF: {{ $label }}
</span>
