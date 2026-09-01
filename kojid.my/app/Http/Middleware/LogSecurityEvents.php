<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * LogSecurityEvents
 *
 * Records security-relevant HTTP events to the security_logs table.
 * Covers: financial record access, admin panel access.
 * Login/logout events are logged separately in the Auth controllers.
 */
class LogSecurityEvents
{
    /** Route name patterns that trigger a security log entry */
    private const SENSITIVE_PATTERNS = [
        'ledger.*', 'settlements.*', 'reports.*',
        'admin.*', 'super-admin.*',
        'deposits.*approve*', 'deposits.*finance*',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (Auth::check() && $this->isSensitiveRoute($request)) {
            $this->log($request, 'financial_access');
        }

        return $response;
    }

    private function isSensitiveRoute(Request $request): bool
    {
        $routeName = $request->route()?->getName() ?? '';

        foreach (self::SENSITIVE_PATTERNS as $pattern) {
            if (fnmatch($pattern, $routeName)) {
                return true;
            }
        }

        return false;
    }

    private function log(Request $request, string $eventType): void
    {
        try {
            DB::table('security_logs')->insert([
                'tenant_id'   => Auth::user()->tenant_id,
                'user_id'     => Auth::id(),
                'event_type'  => $eventType,
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'metadata'    => json_encode([
                    'route'  => $request->route()?->getName(),
                    'method' => $request->method(),
                    'url'    => $request->fullUrl(),
                ]),
                'occurred_at' => now(),
            ]);
        } catch (\Throwable) {
            // Never let audit logging break the main request
        }
    }
}
