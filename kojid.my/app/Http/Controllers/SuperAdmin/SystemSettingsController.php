<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Services\NavigationMenuService;

class SystemSettingsController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Retrieve current root email setting
        $rootEmail = DB::table('systemwide_settings')->where('setting_key', 'sole_super_admin_email')->value('setting_value') ?? NavigationMenuService::SOLE_SUPER_ADMIN_EMAIL;

        $isSuperAdmin = strtolower(trim($user->email)) === strtolower(trim($rootEmail))
            || $user->hasRole('super_admin')
            || $user->hasRole('superadmin')
            || !empty($user->is_super_admin);

        if (!$isSuperAdmin) {
            abort(403, "SECURITY VIOLATION: Systemwide Settings is strictly restricted to the Sole Platform Root Super Admin ({$rootEmail}).");
        }

        $settings = DB::table('systemwide_settings')->pluck('setting_value', 'setting_key')->toArray();

        $activeUsers = DB::table('users')
            ->select('id', 'name', 'email')
            ->where('is_active', 1)
            ->orderBy('name')
            ->get();

        $isEditingMode = $request->query('mode') === 'edit' || session()->has('errors');

        $systemStatus = [
            'sole_super_admin_email' => $settings['sole_super_admin_email'] ?? $rootEmail,
            'root_status' => 'SOLE PLATFORM ROOT SUPER ADMIN (ACTIVE & VERIFIED)',
            'total_tenants' => DB::table('tenants')->count(),
            'total_users' => DB::table('users')->count(),
            'total_transactions' => DB::table('transaction_intents')->count(),
            'default_currency' => $settings['default_currency'] ?? 'MYR',
            'default_language' => $settings['default_language'] ?? 'ms',
            'default_timezone' => $settings['default_timezone'] ?? 'Asia/Kuala_Lumpur',
            'session_timeout_minutes' => $settings['session_timeout_minutes'] ?? '60',
            'invitation_gateway_status' => $settings['invitation_gateway_status'] ?? 'ENABLED',
            'platform_maintenance_mode' => $settings['platform_maintenance_mode'] ?? 'OFF',
            'default_quota_commodity' => $settings['default_quota_commodity'] ?? 'COOKING_OIL_BULK',
            'deposit_overdraft_policy' => $settings['deposit_overdraft_policy'] ?? 'DISALLOW',
        ];

        return view('admin.settings.index', compact('systemStatus', 'activeUsers', 'isEditingMode'));
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $rootEmail = DB::table('systemwide_settings')->where('setting_key', 'sole_super_admin_email')->value('setting_value') ?? NavigationMenuService::SOLE_SUPER_ADMIN_EMAIL;

        $isSuperAdmin = strtolower(trim($user->email)) === strtolower(trim($rootEmail))
            || $user->hasRole('super_admin')
            || $user->hasRole('superadmin')
            || !empty($user->is_super_admin);

        if (!$isSuperAdmin) {
            abort(403, "SECURITY VIOLATION: Unauthorized settings update attempt.");
        }

        // Validate re-entered password specifically for sitewide settings security
        $request->validate([
            'confirm_password' => ['required', 'string'],
            'default_currency' => ['required', 'string'],
            'default_language' => ['required', 'string'],
            'default_timezone' => ['required', 'string'],
            'session_timeout_minutes' => ['required', 'string'],
            'platform_maintenance_mode' => ['required', 'string'],
            'invitation_gateway_status' => ['required', 'string'],
            'default_quota_commodity' => ['required', 'string'],
            'deposit_overdraft_policy' => ['required', 'string'],
            'reassign_super_admin_user_id' => ['nullable', 'exists:users,id'],
        ]);

        if (!Hash::check($request->confirm_password, $user->password)) {
            return back()->withErrors(['confirm_password' => 'Kata laluan pengesahan tidak sah! / Invalid password verification! Systemwide settings were not saved.'])->withInput();
        }

        // Update Systemwide Settings Table
        $keysToUpdate = [
            'default_currency' => $request->default_currency,
            'default_language' => $request->default_language,
            'default_timezone' => $request->default_timezone,
            'session_timeout_minutes' => $request->session_timeout_minutes,
            'platform_maintenance_mode' => $request->platform_maintenance_mode,
            'invitation_gateway_status' => $request->invitation_gateway_status,
            'default_quota_commodity' => $request->default_quota_commodity,
            'deposit_overdraft_policy' => $request->deposit_overdraft_policy,
        ];

        foreach ($keysToUpdate as $key => $val) {
            DB::table('systemwide_settings')->updateOrInsert(
                ['setting_key' => $key],
                ['setting_value' => $val, 'updated_at' => now()]
            );
        }

        // Reassign Sole Super Admin Role if selected
        if ($request->filled('reassign_super_admin_user_id')) {
            $newUser = DB::table('users')->where('id', $request->reassign_super_admin_user_id)->first();
            if ($newUser) {
                DB::table('systemwide_settings')->updateOrInsert(
                    ['setting_key' => 'sole_super_admin_email'],
                    ['setting_value' => $newUser->email, 'updated_at' => now()]
                );

                // Assign super_admin Spatie role to new user
                $roleId = DB::table('roles')->where('name', 'super_admin')->value('id');
                if ($roleId) {
                    DB::table('model_has_roles')->insertOrIgnore([
                        'role_id' => $roleId,
                        'model_type' => 'App\\Models\\User',
                        'model_id' => $newUser->id
                    ]);
                }
            }
        }

        return redirect()->route('super-admin.system-settings.index')->with('success', 'Tetapan sistem sejagat berjaya dikemas kini! / Systemwide platform settings successfully saved!');
    }

    public function restoreDefaults(Request $request)
    {
        $user = $request->user();
        $rootEmail = DB::table('systemwide_settings')->where('setting_key', 'sole_super_admin_email')->value('setting_value') ?? NavigationMenuService::SOLE_SUPER_ADMIN_EMAIL;

        $isSuperAdmin = strtolower(trim($user->email)) === strtolower(trim($rootEmail))
            || $user->hasRole('super_admin')
            || $user->hasRole('superadmin')
            || !empty($user->is_super_admin);

        if (!$isSuperAdmin) {
            abort(403, "SECURITY VIOLATION: Unauthorized settings restore attempt.");
        }

        $defaults = [
            'sole_super_admin_email' => NavigationMenuService::SOLE_SUPER_ADMIN_EMAIL,
            'default_currency' => 'MYR',
            'default_language' => 'ms',
            'default_timezone' => 'Asia/Kuala_Lumpur',
            'session_timeout_minutes' => '60',
            'platform_maintenance_mode' => 'OFF',
            'invitation_gateway_status' => 'ENABLED',
            'default_quota_commodity' => 'COOKING_OIL_BULK',
            'deposit_overdraft_policy' => 'DISALLOW',
        ];

        foreach ($defaults as $key => $val) {
            DB::table('systemwide_settings')->updateOrInsert(
                ['setting_key' => $key],
                ['setting_value' => $val, 'updated_at' => now()]
            );
        }

        return redirect()->route('super-admin.system-settings.index')->with('success', 'Tetapan sistem telah dipulihkan ke nilai asal! / Sitewide platform settings restored to factory defaults!');
    }
}
