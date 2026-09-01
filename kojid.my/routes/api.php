<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\EntityController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\LedgerController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
| All responses: { "data": {...}, "meta": { "timestamp", "tenant_id" }, "errors": [] }
| Auth: Laravel Sanctum token-based
| Rate limit: 60 requests/minute per user
*/

Route::prefix('v1')->group(function () {

    // ── Auth (public) ─────────────────────────────────────────────────────────
    Route::post('/auth/login',  [LoginController::class, 'login'])->name('api.login');
    Route::post('/auth/logout', [LogoutController::class, 'logout'])
        ->middleware('auth:sanctum')->name('api.logout');

    // ── Authenticated API routes ──────────────────────────────────────────────
    Route::middleware([
        'auth:sanctum',
        'throttle:60,1',
        \App\Http\Middleware\EnsureTenantContext::class,
    ])->group(function () {

        // Inbound Orders
        Route::get('/orders/inbound',                   [OrderController::class, 'indexInbound']);
        Route::post('/orders/inbound',                  [OrderController::class, 'storeInbound']);
        Route::get('/orders/inbound/{order}',           [OrderController::class, 'showInbound']);
        Route::post('/orders/inbound/{order}/transition', [OrderController::class, 'transitionInbound']);

        // Outbound Orders
        Route::get('/orders/outbound',                    [OrderController::class, 'indexOutbound']);
        Route::post('/orders/outbound',                   [OrderController::class, 'storeOutbound']);
        Route::get('/orders/outbound/{order}',            [OrderController::class, 'showOutbound']);
        Route::post('/orders/outbound/{order}/transition', [OrderController::class, 'transitionOutbound']);

        // Entities
        Route::get('/entities',       [EntityController::class, 'index']);
        Route::post('/entities',      [EntityController::class, 'store']);
        Route::get('/entities/{entity}', [EntityController::class, 'show']);
        Route::patch('/entities/{entity}', [EntityController::class, 'update']);

        // Deposits
        Route::get('/deposits',                          [PaymentController::class, 'indexDeposits']);
        Route::post('/deposits/{deposit}/approve-refund', [PaymentController::class, 'approveRefund']);
        Route::post('/deposits/{deposit}/finance-approve', [PaymentController::class, 'financeApprove']);

        // Ledger
        Route::get('/ledger/entries',       [LedgerController::class, 'index']);
        Route::get('/ledger/trial-balance', [LedgerController::class, 'trialBalance']);

        // Reports
        Route::get('/reports/dashboard',   [\App\Http\Controllers\Report\ReportController::class, 'dashboard']);
        Route::get('/reports/ghost-orders', [\App\Http\Controllers\Report\ReportController::class, 'ghostOrders']);
    });
});
