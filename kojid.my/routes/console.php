<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| KOJID Scheduler
|--------------------------------------------------------------------------
| Guillotina timers run every minute.
| SLA warnings run every 5 minutes.
| Both use withoutOverlapping() to prevent concurrent execution.
*/

if (config('kojid.guillotina.enabled')) {
    Schedule::command('kojid:process-guillotina')
        ->everyMinute()
        ->withoutOverlapping()
        ->runInBackground()
        ->onFailure(function () {
            \Illuminate\Support\Facades\Log::critical('KOJID:Guillotina scheduler failed');
        });
}

Schedule::command('kojid:send-sla-warnings')
    ->everyFiveMinutes()
    ->withoutOverlapping()
    ->runInBackground();

// Clean up old read notifications (older than 90 days)
Schedule::call(function () {
    \App\Models\KojidNotification::whereNotNull('read_at')
        ->where('created_at', '<', now()->subDays(90))
        ->delete();
})->weekly()->sundays()->at('02:00');
