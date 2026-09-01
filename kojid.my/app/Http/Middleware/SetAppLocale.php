<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Tenant;
use Illuminate\Support\Facades\App;

class SetAppLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = 'ms'; // Default absolute fallback

        // 1. Check session first
        if (session()->has('locale')) {
            $locale = session('locale');
        } 
        // 2. Check cookie for cross-session stickiness
        elseif ($request->cookie('locale')) {
            $locale = $request->cookie('locale');
            session(['locale' => $locale]);
        }
        // 3. Check authenticated user preference
        elseif ($request->user() && $request->user()->locale) {
            $locale = $request->user()->locale;
            session(['locale' => $locale]);
            cookie()->queue('locale', $locale, 60 * 24 * 365);
        } 
        // 3. Fall back to default system setting configured by Master Tenant
        else {
            try {
                $masterTenant = Tenant::whereNull('parent_id')->first();
                if ($masterTenant) {
                    $locale = $masterTenant->getSetting('system.default_locale', 'ms');
                }
            } catch (\Exception $e) {
                // Keep default if DB query fails during install/setup
            }
        }

        // Validate locale
        if (!in_array($locale, ['ms', 'en'])) {
            $locale = 'ms';
        }

        // Apply active translation locale
        App::setLocale($locale);

        return $next($request);
    }
}
