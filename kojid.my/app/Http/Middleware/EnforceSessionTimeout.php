<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnforceSessionTimeout
 *
 * Logs out users who have been inactive for longer than SESSION_LIFETIME minutes.
 * Default: 30 minutes (configurable via .env SESSION_LIFETIME).
 * Resets the activity timestamp on every authenticated request.
 */
class EnforceSessionTimeout
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $timeoutMinutes = (int) config('session.lifetime', 30);
            $lastActivity   = session('_last_activity_at');

            if ($lastActivity && now()->diffInMinutes($lastActivity) >= $timeoutMinutes) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                if ($request->expectsJson()) {
                    return response()->json(['message' => 'Session expired. Please log in again.'], 401);
                }

                return redirect()->route('login')->with('warning',
                    __('auth.session_expired')
                );
            }

            session(['_last_activity_at' => now()]);
        }

        return $next($request);
    }
}
