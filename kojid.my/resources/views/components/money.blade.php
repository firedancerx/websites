{{-- resources/views/components/money.blade.php --}}
{{-- Consistent MYR currency display. Negative values in red, positive in green when colored. --}}
@props(['amount', 'colored' => false, 'size' => 'normal'])

@php
$num      = (float) $amount;
$negative = $num < 0;
$class    = $colored ? ($negative ? 'text-myr-neg' : 'text-myr-pos') : 'text-myr';
$formatted = 'RM ' . number_format(abs($num), 2);
@endphp

<span class="{{ $class }}">
    @if($negative)−@endif{{ $formatted }}
</span>
