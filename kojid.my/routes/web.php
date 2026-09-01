<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\Order\InboundOrderController;
use App\Http\Controllers\Order\OutboundOrderController;
use App\Http\Controllers\Tenant\EntityController;
use App\Http\Controllers\Tenant\UserController;
use App\Http\Controllers\Tenant\SettingsController;
use App\Http\Controllers\Payment\DepositController;
use App\Http\Controllers\Payment\SettlementController;
use App\Http\Controllers\Ledger\LedgerController;
use App\Http\Controllers\Report\ReportController;
use App\Http\Controllers\SuperAdmin\TenantController;

// ── Guest routes (no auth required) ──────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login'])->name('login.submit');
});

// ── Language switch (accessible to guests & auth users) ──────────────────────
Route::post('/locale/{locale}', function (string $locale) {
    if (in_array($locale, ['ms', 'en'])) {
        if (auth()->check()) {
            auth()->user()->update(['locale' => $locale]);
        }
        session(['locale' => $locale]);
        cookie()->queue('locale', $locale, 60 * 24 * 365); // 1 year cookie
        app()->setLocale($locale);
    }
    return back();
})->where('locale', 'ms|en')->name('locale.switch');

// ── Authenticated routes ──────────────────────────────────────────────────────
Route::middleware([
    'auth',
    \App\Http\Middleware\EnsureTenantContext::class,
    \App\Http\Middleware\EnforceSessionTimeout::class,
    \App\Http\Middleware\LogSecurityEvents::class,
])->group(function () {

    Route::post('/logout', [LogoutController::class, 'logout'])->name('logout');

    // ── Dashboard ─────────────────────────────────────────────────────────────
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // ── User Profile & Account Settings ──────────────────────────────────────
    Route::get('/profile', [App\Http\Controllers\ProfileController::class, 'index'])->name('profile');
    Route::post('/profile', [App\Http\Controllers\ProfileController::class, 'update'])->name('profile.update');
    Route::get('/settings', [App\Http\Controllers\ProfileController::class, 'index'])->name('settings.index');

    // ── Inbound Orders (MSK-) ─────────────────────────────────────────────────
    Route::prefix('orders/inbound')->name('orders.inbound.')->group(function () {
        Route::get('/',           [InboundOrderController::class, 'index'])->name('index');
        Route::get('/create',     [InboundOrderController::class, 'create'])->name('create');
        Route::post('/',          [InboundOrderController::class, 'store'])->name('store');
        Route::get('/{order}',    [InboundOrderController::class, 'show'])->name('show');
        Route::post('/{order}/transition', [InboundOrderController::class, 'transition'])->name('transition');
    });

    // ── Outbound Orders (KLR-) ────────────────────────────────────────────────
    Route::prefix('orders/outbound')->name('orders.outbound.')->group(function () {
        Route::get('/',           [OutboundOrderController::class, 'index'])->name('index');
        Route::get('/create',     [OutboundOrderController::class, 'create'])->name('create');
        Route::post('/',          [OutboundOrderController::class, 'store'])->name('store');
        Route::get('/{order}',    [OutboundOrderController::class, 'show'])->name('show');
        Route::post('/{order}/transition', [OutboundOrderController::class, 'transition'])->name('transition');
    });

    // ── Quota Governance (Leg 1 Checks) ───────────────────────────────────────
    Route::prefix('quota')->name('quota.')->group(function () {
        Route::get('/',              [\App\Http\Controllers\Quota\QuotaClaimController::class, 'index'])->name('index');
        Route::get('/create',        [\App\Http\Controllers\Quota\QuotaClaimController::class, 'create'])->name('create');
        Route::post('/',             [\App\Http\Controllers\Quota\QuotaClaimController::class, 'store'])->name('store');
        Route::get('/queue',         [\App\Http\Controllers\Quota\QuotaClaimController::class, 'queue'])->name('queue');
        Route::get('/balance',       [\App\Http\Controllers\Quota\QuotaClaimController::class, 'balance'])->name('balance');
        Route::post('/{claim}/verify', [\App\Http\Controllers\Quota\QuotaClaimController::class, 'verify'])->name('verify');
    });

    // ── Entities ──────────────────────────────────────────────────────────────
    Route::prefix('entities')->name('entities.')->group(function () {
        Route::get('/',                           [EntityController::class, 'index'])->name('index');
        Route::get('/pdf',                        [EntityController::class, 'pdf'])->name('pdf');
        Route::get('/create',                     [EntityController::class, 'create'])->name('create');
        Route::post('/',                          [EntityController::class, 'store'])->name('store');
        Route::get('/{entity}',                   [EntityController::class, 'show'])->name('show');
        Route::post('/{entity}/approve-kyc',      [EntityController::class, 'approveKyc'])->name('approve-kyc');
        Route::post('/{entity}/blacklist',        [EntityController::class, 'blacklist'])->name('blacklist');
        Route::post('/{entity}/unblacklist',      [EntityController::class, 'unblacklist'])->name('unblacklist');
    });

    // ── Deposits ──────────────────────────────────────────────────────────────
    Route::prefix('deposits')->name('deposits.')->group(function () {
        Route::get('/',                                    [DepositController::class, 'index'])->name('index');
        Route::post('/{deposit}/approve-refund',          [DepositController::class, 'approveRefund'])->name('approve-refund');
        Route::post('/{deposit}/finance-approve-refund',  [DepositController::class, 'financeApproveRefund'])->name('finance-approve');
    });

    // ── Ledger ────────────────────────────────────────────────────────────────
    Route::prefix('ledger')->name('ledger.')->middleware('can:viewAny,App\Models\LedgerEntry')->group(function () {
        Route::get('/',               [LedgerController::class, 'index'])->name('index');
        Route::get('/trial-balance',  [LedgerController::class, 'trialBalance'])->name('trial-balance');
    });

    // ── Reports ───────────────────────────────────────────────────────────────
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/dashboard',     [ReportController::class, 'dashboard'])->name('dashboard');
        Route::get('/trial-balance', [ReportController::class, 'trialBalance'])->name('trial-balance');
        Route::get('/ghost-orders',  [ReportController::class, 'ghostOrders'])->name('ghost-orders');
        Route::get('/aging',         [ReportController::class, 'aging'])->name('aging');
        Route::get('/audit',         [ReportController::class, 'auditTrail'])->name('audit');
    });

    // ── Notifications ─────────────────────────────────────────────────────────
    Route::prefix('notifications')->name('notifications.')->group(function () {
        Route::get('/', function () {
            $notifications = \App\Models\KojidNotification::forUser(auth()->id())
                ->orderByDesc('created_at')->paginate(30);
            return view('notifications.index', compact('notifications'));
        })->name('index');

        Route::post('/mark-all-read', function () {
            app(\App\Services\NotificationService::class)->markAllRead(auth()->user());
            return back()->with('success', 'All notifications marked as read.');
        })->name('mark-all-read');
    });

    // ── Super Admin ───────────────────────────────────────────────────────────
    Route::prefix('admin')->name('admin.')->middleware('role:super_admin')->group(function () {
        Route::get('/tenants',                  [TenantController::class, 'index'])->name('tenants.index');
        Route::get('/tenants/create',           [TenantController::class, 'create'])->name('tenants.create');
        Route::post('/tenants',                 [TenantController::class, 'store'])->name('tenants.store');
        Route::get('/tenants/{tenant}/edit',    [TenantController::class, 'edit'])->name('tenants.edit');
        Route::put('/tenants/{tenant}',          [TenantController::class, 'update'])->name('tenants.update');
        Route::post('/tenants/{tenant}/suspend', [TenantController::class, 'suspend'])->name('tenants.suspend');
        Route::post('/tenants/{tenant}/reactivate', [TenantController::class, 'reactivate'])->name('tenants.reactivate');
        Route::post('/tenants/{tenant}/impersonate', [TenantController::class, 'impersonate'])->name('tenants.impersonate');
        Route::post('/tenants/exit-impersonate', [TenantController::class, 'exitImpersonate'])->name('tenants.exit-impersonate');

        // Backups management
        Route::get('/backups', [App\Http\Controllers\SuperAdmin\BackupController::class, 'index'])->name('backups.index');
        Route::post('/backups', [App\Http\Controllers\SuperAdmin\BackupController::class, 'store'])->name('backups.store');
        Route::get('/backups/{filename}/download', [App\Http\Controllers\SuperAdmin\BackupController::class, 'download'])->name('backups.download');
        Route::delete('/backups/{filename}', [App\Http\Controllers\SuperAdmin\BackupController::class, 'destroy'])->name('backups.destroy');

        // Systemwide Settings (Sole Super Admin Root Only)
        Route::get('/system-settings', [App\Http\Controllers\SuperAdmin\SystemSettingsController::class, 'index'])->name('system-settings.index');
        Route::post('/system-settings/update', [App\Http\Controllers\SuperAdmin\SystemSettingsController::class, 'update'])->name('system-settings.update');
        Route::post('/system-settings/restore-defaults', [App\Http\Controllers\SuperAdmin\SystemSettingsController::class, 'restoreDefaults'])->name('system-settings.restore-defaults');
    });
    
    Route::get('/admin/system-settings', [App\Http\Controllers\SuperAdmin\SystemSettingsController::class, 'index'])->middleware('auth')->name('super-admin.system-settings.index');
    Route::post('/admin/system-settings/update', [App\Http\Controllers\SuperAdmin\SystemSettingsController::class, 'update'])->middleware('auth')->name('super-admin.system-settings.update');
    Route::post('/admin/system-settings/restore-defaults', [App\Http\Controllers\SuperAdmin\SystemSettingsController::class, 'restoreDefaults'])->middleware('auth')->name('super-admin.system-settings.restore-defaults');
});
