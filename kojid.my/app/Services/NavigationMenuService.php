<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class NavigationMenuService
{
    /**
     * Sole Root Super Admin Email Constant.
     */
    public const SOLE_SUPER_ADMIN_EMAIL = 'superadmin@kojid.com.my';

    /**
     * Helper for dynamic locale translation strings.
     */
    private static function trans(string $ms, string $en): string
    {
        return app()->getLocale() === 'ms' ? $ms : $en;
    }

    /**
     * Generate dynamic, role-tailored navigation menu structure for the authenticated user.
     */
    public static function getMenuForUser(?User $user, ?\App\Models\Tenant $currentTenant = null): array
    {
        if (!$user) {
            return [];
        }

        $tenant = $currentTenant ?? \App\Services\TenantContextService::current() ?? $user->tenant;
        $role = self::resolveRole($user, $tenant);

        switch ($role) {
            case 'superadmin':
                return self::getSuperadminMenu();

            case 'mediator':
                return self::getMediatorMenu($tenant?->id ?? 1);

            case 'virtual_seller':
                return self::getVirtualSellerMenu($tenant?->id);

            case 'buyer_with_quota':
                return self::getVirtualBuyerMenu($tenant?->id);

            case 'actual_supplier':
                return self::getActualSellerMenu($tenant?->id);

            case 'standard_buyer':
                return self::getActualBuyerMenu($tenant?->id);

            case 'auditor':
                return self::getAuditorMenu();

            default:
                return self::getBasicMenu();
        }
    }

    /**
     * Resolve the primary operational role of the user/tenant.
     * Enforces superadmin@kojid.com.my as the SOLE ROOT SUPER ADMIN.
     */
    public static function resolveRole(?User $user, $tenant = null): string
    {
        if (!$user) {
            return 'standard_buyer';
        }

        // If impersonating a tenant, resolve the role of the IMPERSONATED TENANT!
        if (\App\Services\TenantContextService::isImpersonating()) {
            $activeTenant = \App\Services\TenantContextService::current();
            if ($activeTenant) {
                $tenant = $activeTenant;
            }
        } else {
            $rootEmail = DB::table('systemwide_settings')->where('setting_key', 'sole_super_admin_email')->value('setting_value') ?? self::SOLE_SUPER_ADMIN_EMAIL;

            if (strtolower(trim($user->email)) === strtolower(trim($rootEmail)) || $user->hasRole('super_admin') || $user->hasRole('superadmin') || $user->is_super_admin) {
                return 'superadmin';
            }
        }

        if (!$tenant) {
            return 'standard_buyer';
        }

        // Decode tenant_types JSON if string
        $types = is_string($tenant->tenant_types) ? json_decode($tenant->tenant_types, true) : ($tenant->tenant_types ?? []);
        if (!is_array($types)) {
            $types = [];
        }

        if ($tenant->id == 1 || $tenant->id == 112 || $tenant->id == 113 || in_array('mediator', $types)) {
            return 'mediator';
        }

        if (in_array('virtual_seller', $types)) {
            return 'virtual_seller';
        }

        if (in_array('buyer_with_quota', $types)) {
            return 'buyer_with_quota';
        }

        if (in_array('actual_supplier', $types)) {
            return 'actual_supplier';
        }

        if (in_array('auditor', $types)) {
            return 'auditor';
        }

        return 'standard_buyer';
    }

    private static function getSuperadminMenu(): array
    {
        return [
            // Tier 1: Platform Administration
            ['label' => self::trans('Papan Pemuka Platform', 'Platform Overview'), 'route' => 'dashboard', 'icon' => 'chart-bar'],
            ['label' => self::trans('Pengurusan Tenant', 'Tenant Ecosystems'), 'route' => 'admin.tenants.index', 'icon' => 'building-office-2'],
            ['label' => self::trans('Tetapan Sistem Platform', 'Systemwide Settings'), 'route' => 'super-admin.system-settings.index', 'icon' => 'cog-6-tooth', 'note' => self::trans('Kawalan Pentadbir Utama', 'Exclusive Root Control')],
            ['label' => self::trans('Sandaran Sistem', 'System Backups'), 'route' => 'admin.backups.index', 'icon' => 'archive-box'],
            ['label' => self::trans('Log Aktiviti Audit', 'Audit Activity Logs'), 'route' => 'reports.audit', 'icon' => 'clipboard-document-list'],

            // Tier 2: Mediator Operations (SuperAdmin is also Master Mediator #1)
            ['label' => self::trans('Penuntutan Kuota (Quota Claims)', 'Quota Claims'), 'route' => 'quota.index', 'icon' => 'ticket'],
            ['label' => self::trans('Pengurusan Escrow Deposit', 'Deposit Escrow Accounts'), 'route' => 'deposits.index', 'icon' => 'banknotes'],
            ['label' => self::trans('Pelesenan Entity & KYC', 'Entity Licensing & KYC'), 'route' => 'entities.index', 'icon' => 'user-group'],
            ['label' => self::trans('Pesanan Masuk (Inbound MSK)', 'Inbound Orders (MSK)'), 'route' => 'orders.inbound.index', 'icon' => 'inbox-stack'],
            ['label' => self::trans('Pesanan Keluar (Outbound KJD)', 'Outbound Orders (KJD)'), 'route' => 'orders.outbound.index', 'icon' => 'document-duplicate'],

            // Tier 3: General Ledger & Financial Operations (Everyone's General Menu)
            ['label' => self::trans('Buku Tunai & Bank (Cashbook)', 'Cashbook & Bank'), 'route' => 'ledger.index', 'icon' => 'calculator'],
            ['label' => self::trans('Inventori Komoditi (Inventory)', 'Commodity Inventory'), 'route' => 'reports.dashboard', 'icon' => 'rectangle-stack'],
            ['label' => self::trans('Akaun Kena Bayar (AP)', 'Accounts Payable (AP)'), 'route' => 'reports.aging', 'icon' => 'arrow-trending-down'],
            ['label' => self::trans('Akaun Kena Terima (AR)', 'Accounts Receivable (AR)'), 'route' => 'reports.trial-balance', 'icon' => 'arrow-trending-up'],
            ['label' => self::trans('Penyata Untung Rugi (P&L)', 'Profit & Loss Statement'), 'route' => 'reports.trial-balance', 'icon' => 'chart-pie'],
        ];
    }

    private static function getMediatorMenu(int $tenantId): array
    {
        $pendingInboxCount = DB::table('intent_mailbox_entries')
            ->where('tenant_id', $tenantId)
            ->where('folder', 'INBOX')
            ->where('intent_status', 'PENDING_DECISION')
            ->count();

        return [
            ['label' => self::trans('Papan Pemuka Mediator', 'Mediator Dashboard'), 'route' => 'dashboard', 'icon' => 'home'],
            ['label' => self::trans('Peti Mel Hasrat (Hub)', 'Intent Mailbox (Hub)'), 'route' => 'orders.inbound.index', 'icon' => 'inbox-stack', 'badge' => $pendingInboxCount],
            ['label' => self::trans('Dokumen Kontrak Outbox', 'Contract Documents Outbox'), 'route' => 'orders.outbound.index', 'icon' => 'document-duplicate'],
            ['label' => self::trans('Penghantaran Inbound & Outbound', 'Inbound & Outbound Deliveries'), 'route' => 'orders.inbound.index', 'icon' => 'truck'],
            ['label' => self::trans('Akaun Escrow Deposit', 'Deposit Escrow Accounts'), 'route' => 'deposits.index', 'icon' => 'banknotes'],
            ['label' => self::trans('Buku Tunai & Penyesuaian Bank', 'Cashbook & Bank Recon'), 'route' => 'ledger.index', 'icon' => 'calculator'],
            ['label' => self::trans('Daftar Untung Rugi Per-Penghantaran', 'Per-Shipment P&L Register'), 'route' => 'reports.index', 'icon' => 'chart-pie'],
            ['label' => self::trans('Pengurusan Sub-Tenant', 'Sub-Tenant Onboarding'), 'route' => 'entities.index', 'icon' => 'user-group'],
            ['label' => self::trans('Tetapan Ekosistem', 'Ecosystem Settings'), 'route' => 'settings.index', 'icon' => 'cog-6-tooth'],
        ];
    }

    private static function getVirtualSellerMenu(?int $tenantId): array
    {
        return [
            ['label' => self::trans('Papan Pemuka Pembekal Maya', 'Virtual Seller Dashboard'), 'route' => 'dashboard', 'icon' => 'home'],
            ['label' => self::trans('Hantar Hasrat Jualan Kuota', 'Submit Quota Sell Intent'), 'route' => 'orders.inbound.create', 'icon' => 'document-plus', 'note' => self::trans('Muat Naik Permit Bersubsidi Wajib', 'Mandatory Subsidy Permit Upload')],
            ['label' => self::trans('Peti Mel Hasrat Saya', 'My Intent Mailbox'), 'route' => 'orders.inbound.index', 'icon' => 'envelope'],
            ['label' => self::trans('Pesanan Pembelian Proforma Saya', 'My Proforma Purchase Orders'), 'route' => 'orders.outbound.index', 'icon' => 'document-text'],
            ['label' => self::trans('Daftar Tuntutan Kuota', 'Quota Claims Register'), 'route' => 'reports.index', 'icon' => 'ticket'],
            ['label' => self::trans('Baki Deposit', 'Deposit Balance'), 'route' => 'deposits.index', 'icon' => 'wallet'],
        ];
    }

    private static function getVirtualBuyerMenu(?int $tenantId): array
    {
        return [
            ['label' => self::trans('Papan Pemuka Pembeli Maya', 'Virtual Buyer Dashboard'), 'route' => 'dashboard', 'icon' => 'home'],
            ['label' => self::trans('Hantar Hasrat Belian Kuota', 'Submit Quota Buy Intent'), 'route' => 'orders.outbound.create', 'icon' => 'document-plus', 'note' => self::trans('Muat Naik Permit Bersubsidi Wajib', 'Mandatory Subsidy Permit Upload')],
            ['label' => self::trans('Peti Mel Hasrat Saya', 'My Intent Mailbox'), 'route' => 'orders.inbound.index', 'icon' => 'envelope'],
            ['label' => self::trans('Pesanan Jualan Proforma Saya', 'My Proforma Sales Orders'), 'route' => 'orders.outbound.index', 'icon' => 'document-text'],
            ['label' => self::trans('Daftar Tuntutan Kuota', 'Quota Claims Register'), 'route' => 'reports.index', 'icon' => 'ticket'],
            ['label' => self::trans('Baki Deposit', 'Deposit Balance'), 'route' => 'deposits.index', 'icon' => 'wallet'],
        ];
    }

    private static function getActualSellerMenu(?int $tenantId): array
    {
        return [
            ['label' => self::trans('Papan Pemuka Pembekal Fizikal', 'Actual Seller Dashboard'), 'route' => 'dashboard', 'icon' => 'home'],
            ['label' => self::trans('Hantar Hasrat Jualan Dagangan', 'Submit Trade Sell Intent'), 'route' => 'orders.inbound.create', 'icon' => 'document-plus'],
            ['label' => self::trans('Pesanan Pembelian Saya (MSK-PO)', 'My Purchase Orders (MSK-PO)'), 'route' => 'orders.inbound.index', 'icon' => 'shopping-cart'],
            ['label' => self::trans('Resit Penghantaran Masuk (MSK-DO)', 'Inward Delivery Receipts (MSK-DO)'), 'route' => 'orders.outbound.index', 'icon' => 'truck'],
            ['label' => self::trans('Muat Naik Invois Pembekal Fizikal', 'Upload Physical Vendor Invoices'), 'route' => 'settlements.index', 'icon' => 'document-arrow-up'],
            ['label' => self::trans('Akaun Deposit', 'Deposit Account'), 'route' => 'deposits.index', 'icon' => 'wallet'],
        ];
    }

    private static function getActualBuyerMenu(?int $tenantId): array
    {
        return [
            ['label' => self::trans('Papan Pemuka Pembeli Fizikal', 'Actual Buyer Dashboard'), 'route' => 'dashboard', 'icon' => 'home'],
            ['label' => self::trans('Hantar Hasrat Belian Dagangan', 'Submit Trade Buy Intent'), 'route' => 'orders.outbound.create', 'icon' => 'document-plus'],
            ['label' => self::trans('Pesanan Jualan Saya (KLR-SO)', 'My Sales Orders (KLR-SO)'), 'route' => 'orders.outbound.index', 'icon' => 'shopping-bag'],
            ['label' => self::trans('Nota Penghantaran Keluar (KLR-DO)', 'Outward Delivery Orders (KLR-DO)'), 'route' => 'orders.inbound.index', 'icon' => 'truck'],
            ['label' => self::trans('Invois Keluar (KLR-INV)', 'Outward Invoices (KLR-INV)'), 'route' => 'settlements.index', 'icon' => 'receipt-percent'],
            ['label' => self::trans('Akaun Deposit', 'Deposit Account'), 'route' => 'deposits.index', 'icon' => 'wallet'],
        ];
    }

    private static function getAuditorMenu(): array
    {
        return [
            ['label' => self::trans('Gambaran Keseluruhan Audit', 'Audit Overview'), 'route' => 'dashboard', 'icon' => 'eye'],
            ['label' => self::trans('Audit Hasrat Transaksi', 'Transaction Intents Audit'), 'route' => 'orders.inbound.index', 'icon' => 'clipboard-document-check'],
            ['label' => self::trans('Audit Lejer Am', 'General Ledger Audit'), 'route' => 'ledger.index', 'icon' => 'book-open'],
            ['label' => self::trans('Audit Untung Rugi Penghantaran', 'Shipment P&L Audit'), 'route' => 'reports.index', 'icon' => 'chart-bar-square'],
            ['label' => self::trans('Log Audit Sejarah Harga', 'Price History Audit Logs'), 'route' => 'settings.index', 'icon' => 'clock'],
        ];
    }

    private static function getBasicMenu(): array
    {
        return [
            ['label' => self::trans('Papan Pemuka', 'Dashboard'), 'route' => 'dashboard', 'icon' => 'home'],
        ];
    }
}
