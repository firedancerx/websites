<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * LoginController
 *
 * Handles authentication with:
 * - Account lockout after 5 failed attempts (30 min lockout)
 * - Session activity timestamp initialisation
 * - Security event logging
 * - Locale loading from user profile
 */
class LoginController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.login');
    }

    /**
     * Attempt authentication.
     *
     * @throws ValidationException on credential failure
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        // Check for user existence first (for lockout check) where user is active
        $user = User::where('email', $request->email)->where('is_active', true)->first();

        if ($user && $user->isLocked()) {
            throw ValidationException::withMessages([
                'email' => [__('auth.account_locked', [
                    'until' => $user->locked_until->setTimezone('Asia/Kuala_Lumpur')->format('H:i d M Y'),
                ])],
            ]);
        }

        if (! Auth::attempt(['email' => $request->email, 'password' => $request->password, 'is_active' => true], $request->boolean('remember'))) {
            // Record failed attempt
            $user?->recordFailedLogin();

            // Log security event
            DB::table('security_logs')->insert([
                'tenant_id'   => $user?->tenant_id,
                'user_id'     => $user?->id,
                'event_type'  => 'failed_login',
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'metadata'    => json_encode(['email' => $request->email]),
                'occurred_at' => now(),
            ]);

            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $user = Auth::user();

        if (! $user->is_active) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => [__('auth.account_disabled')],
            ]);
        }

        // Record successful login
        $user->recordLogin($request->ip());

        // Initialise session activity timer
        session(['_last_activity_at' => now()]);

        // Apply user's locale preference
        app()->setLocale($user->locale ?? 'ms');
        session(['locale' => $user->locale ?? 'ms']);

        // Log successful login
        DB::table('security_logs')->insert([
            'tenant_id'   => $user->tenant_id,
            'user_id'     => $user->id,
            'event_type'  => 'login',
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'metadata'    => null,
            'occurred_at' => now(),
        ]);

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }
}
