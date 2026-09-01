{{-- resources/views/components/guillotina-timer.blade.php --}}
{{-- Countdown timer to SLA deadline. Color-shifts green→amber→red. Pulses under 1h. --}}
@props(['order'])

@if($order->sla_deadline_at && !$order->isInTerminalState())
    @php
        $deadlineIso = $order->sla_deadline_at->setTimezone('Asia/Kuala_Lumpur')->toIso8601String();
    @endphp

    <div x-data="guillotinaTimer('{{ $deadlineIso }}')"
         x-init="init()"
         @destroy="destroy()"
         class="flex items-center gap-2 text-sm">

        <x-icon name="clock" class="w-4 h-4 text-slate-400 shrink-0"/>

        <span x-show="!isExpired">
            <span class="font-mono text-sm" :class="colorClass"
                  :class="{ 'animate-pulse': isPulsing }"
                  x-text="display">
                --:--:--
            </span>
            <span class="text-xs text-slate-400 ml-1">{{ __('orders.until_guillotina') }}</span>
        </span>

        <span x-show="isExpired" class="font-semibold text-guillotina guillotina-critical flex items-center gap-1">
            <x-icon name="exclamation-triangle" class="w-4 h-4"/>
            {{ __('orders.guillotina_overdue') }}
        </span>
    </div>
@elseif($order->guillotina_triggered_at)
    <div class="flex items-center gap-1.5 text-sm">
        <x-icon name="exclamation-triangle" class="w-4 h-4 text-guillotina"/>
        <span class="text-guillotina font-semibold text-xs">
            {{ __('orders.guillotina_triggered') }}
        </span>
    </div>
@endif
