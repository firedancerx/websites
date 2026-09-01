<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Services\NavigationMenuService;

class EnsureRoleAccess
{
    /**
     * Handle an incoming request.
     * Validates that the user's role allows access to the requested route group.
     */
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('login');
        }

        $userRole = NavigationMenuService::resolveRole($user, $user->tenant);

        if ($userRole === 'superadmin') {
            return $next($request); // Superadmin has unrestricted platform access
        }

        if (!empty($allowedRoles) && !in_array($userRole, $allowedRoles)) {
            abort(403, "ACCESS DENIED: Your tenant role ({$userRole}) is not authorized to access this module.");
        }

        return $next($request);
    }
}
