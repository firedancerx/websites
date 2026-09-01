<?php

return [

    /*
    |--------------------------------------------------------------------------
    | KOJID Platform Configuration
    |--------------------------------------------------------------------------
    | Central configuration for all KOJID-specific business logic, SLA timers,
    | deposit rates, Guillotina thresholds, and payment gateway settings.
    */

    'currency' => 'MYR',

    /*
    |--------------------------------------------------------------------------
    | Deposit Defaults
    |--------------------------------------------------------------------------
    | Default deposit rates as percentage of order value.
    | Can be overridden per entity (entity.deposit_rate_override).
    */
    'deposits' => [
        'default_rate'            => 30.00,     // 30% of order value
        'min_rate'                => 5.00,
        'max_rate'                => 100.00,
        'unverified_max_cumulative' => 5000.00, // RM 5,000 KYC threshold
    ],

    /*
    |--------------------------------------------------------------------------
    | SLA Timers (in hours unless noted)
    |--------------------------------------------------------------------------
    | Default SLA deadlines per order type and state.
    | Tenants can override in their settings JSON.
    */
    'sla' => [
        'inbound' => [
            'pending_acceptance'  => 24,   // hours to accept from supplier
            'deposit_committed'   => 48,   // hours to deliver after deposit
            'pending_delivery'    => 72,   // hours to stock after dispatch
        ],
        'outbound' => [
            'pending_buyer_deposit' => 12, // hours for buyer to pay deposit
            'deposit_confirmed'     => 24, // hours to dispatch after deposit
            'in_transit'            => 48, // hours to deliver
            'disputed'              => 72, // hours to resolve dispute
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Guillotina Settings
    |--------------------------------------------------------------------------
    */
    'guillotina' => [
        // Allows operations to suspend automatic cancellation without removing the feature.
        'enabled'             => env('GUILLOTINA_ENABLED', true),
        'warning_hours'       => [4, 1], // Send warnings at 4h and 1h before deadline
        'check_interval_mins' => 1,      // How often the timer command runs
        'grace_period_mins'   => 5,      // Grace period after SLA breach before execution
    ],

    /*
    |--------------------------------------------------------------------------
    | Order Number Formats
    |--------------------------------------------------------------------------
    */
    'order_numbers' => [
        'inbound_prefix'  => 'MSK',
        'outbound_prefix' => 'KLR',
        'sequence_length' => 5,
        // Full format: MSK-2026-0101-00001
    ],

    /*
    |--------------------------------------------------------------------------
    | Payment Gateway
    |--------------------------------------------------------------------------
    */
    'payment' => [
        'gateway_mode'            => env('PAYMENT_GATEWAY_MODE', 'sandbox'), // sandbox | live | manual
        'auto_manual_fallback'    => true,    // Auto-switch to manual on 3 consecutive failures
        'failure_threshold'       => 3,
        'gateway_key'             => env('PAYMENT_GATEWAY_KEY'),
        'gateway_secret'          => env('PAYMENT_GATEWAY_SECRET'),
        'gateway_merchant_id'     => env('PAYMENT_GATEWAY_MERCHANT_ID'),
        'fpx_duitnow_api_url'     => 'https://api.duitnow.my/v1',
        'callback_url'            => '/payments/callback',
    ],

    /*
    |--------------------------------------------------------------------------
    | Aggregation
    |--------------------------------------------------------------------------
    */
    'aggregation' => [
        'allow_mixed_frozen_ambient' => false, // Require isolation flag to mix categories
        'max_batch_size'             => 20,    // Max orders per batch
    ],

    /*
    |--------------------------------------------------------------------------
    | Audit & Compliance
    |--------------------------------------------------------------------------
    */
    'audit' => [
        'retention_years' => 7,  // LHDN 7-year retention requirement
        'log_financial_access' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */
    'reports' => [
        'pdf_paper_size' => 'A4',
        'export_formats' => ['pdf', 'xlsx', 'csv'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Chart of Accounts
    |--------------------------------------------------------------------------
    */
    'accounts' => [
        '1000' => 'Cash / Bank',
        '1100' => 'Accounts Receivable (Belum Terima)',
        '1200' => 'Inventory at Cost',
        '1300' => 'Deposit Asset',
        '2000' => 'Accounts Payable (Belum Bayar)',
        '2100' => 'Deposit Liability',
        '3000' => 'Equity',
        '4000' => 'Sales Revenue',
        '4100' => 'Penalty Income',
        '5000' => 'Cost of Goods Sold',
        '5100' => 'Logistics Cost',
        '5200' => 'Quota Fee Expense',
        '5300' => 'Inventory Write-Off',
    ],

    /*
    |--------------------------------------------------------------------------
    | Working Capital Formula
    |--------------------------------------------------------------------------
    | WC = (1000 + 1100 + 1200) - (2000 + 2100)
    */
    'working_capital' => [
        'assets'      => ['1000', '1100', '1200'],
        'liabilities' => ['2000', '2100'],
    ],

];
