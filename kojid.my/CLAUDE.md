# KOJID (kojid.my)

Laravel 11 / PHP 8.5 / MySQL 8 / Redis multi-tenant B2B food-trading platform for
Malaysian food intermediaries (rice, sugar, cooking oil — BERNAS/KPDNHEP-regulated
commodities). Full technical spec lives in `docs/preview.docx` / `docs/preview.pdf` and `docs/kojid_system_specifications.json`
(50+ pages: architecture, DB schema, service layer, API reference, security,
testing, file manifest, and full source listings in Appendix A).

Contract: RM 36,000, Phases 1–7 (M1 Users, M2 Orders, M3 Aggregation, M4 Payment,
M5 Ledger delivered). M6 Inventory/DoF, M7 Market Intelligence, MFA, and pen-test
are **out of scope** — see doc section 12 "Future Phases."

## Environment

- Served via IIS at `http://localhost/kojid` (virtual app, `public/web.config`
  handles the front-controller rewrite to `index.php`).
- PHP CLI: `C:\php\8.5\php.exe` (no `php`/`mysql` on PATH — invoke with full path).
- MySQL 8.0.29 on `127.0.0.1:3306`, db `kojid_laravel`, `root`/`root` (local dev only).
- Redis configured (`predis`) but **not confirmed running** — `HasOrderNumber` trait
  hard-depends on `Cache::store('redis')->increment()` regardless of default cache
  driver, so order creation will fail if Redis isn't up. Check before testing orders.
- Seeded demo accounts (from `Makefile` / doc, also documented publicly — not a secret):
  - Super Admin: `superadmin@kojid.com.my` / `SuperAdmin@2026!`
  - Tenant Admin: `admin@demo-trading.com.my` / `TenantAdmin@2026!`

## ⚠️ Known issue: project lives inside an actively-syncing OneDrive folder

Path: `D:\Firedancerx\OneDrive\Work2026\Kojid\Kojidapp\kojid.my`

OneDrive's sync filter driver causes PHP's `is_writable()` to return **false
negatives** on `bootstrap/cache` even though writes to it actually succeed. This
crashed every request (web, CLI, and scheduled task) with either:
- `PHP Fatal error: Uncaught ReflectionException: Class "view" does not exist`
- `The ...\bootstrap\cache directory must be present and writable.`
- Random `Maximum execution time of 30 seconds exceeded` (OneDrive I/O contention)

Confirmed via direct test: `is_dir()` → true, `is_writable()` → false,
`file_put_contents()` → succeeds anyway. Pinning the folder ("Always keep on this
device") did **not** fix it — the interference is structural to being under a
OneDrive sync root, not a hydration issue.

**Temporary patch applied** (this session) to unblock local testing: removed the
`is_writable()` pre-flight check in two vendor files, since the real write already
succeeds and will throw its own exception if it genuinely fails:
- `vendor/laravel/framework/src/Illuminate/Foundation/PackageManifest.php` → `write()`
- `vendor/laravel/framework/src/Illuminate/Foundation/ProviderRepository.php` → `writeManifest()`

**This patch is wiped by any `composer install`/`composer update`** — re-apply if
the crash comes back after a dependency update, or better: **move the project out
of OneDrive sync entirely and repoint IIS** — that's the real fix, not yet done.
`max_execution_time` was also raised from 30 → 120 in `C:\php\8.5\php.ini` as a
partial mitigation (global change, affects all sites on this PHP install).

## ⚠️ Known issue: no Windows Task Scheduler job for `schedule:run`

The doc assumes a Unix crontab entry (`* * * * * php artisan schedule:run`) to
drive the Guillotina SLA-forfeiture engine, SLA warning emails, and notification
cleanup. No Windows equivalent existed. Proved this with live data: test order
`MSK-2026-0322-00001` sat SLA-breached in `PENDING_ACCEPTANCE` for 3+ hours without
being guillotined.

A Task Scheduler job **"KOJID Laravel Scheduler"** was created (via a
`run-scheduler.bat` wrapper at the project root, `/sc minute /mo 1`) but is
currently **disabled** (it was crash-looping on the OneDrive bug above before the
patch was applied). Re-enable once confident the boot crash is resolved:
```
schtasks /change /tn "KOJID Laravel Scheduler" /enable
```
Logs to `storage/logs/scheduler.log`.

## Verified-working (DB-level, checked directly via PDO)

- Ledger immutability triggers exist and work: `ledger_entries_no_update` /
  `ledger_entries_no_delete`, both `BEFORE UPDATE/DELETE ... SIGNAL SQLSTATE 45000`.
- Tenant scoping, seed data, audit logging (`security_logs`, `activity_log`) all
  functioning as documented.
- Minor doc drift (not bugs): doc says 8 roles/25 permissions, DB actually has
  9 roles/32 permissions — spec is just stale, not wrong code.

## Tenant & Business Taxonomy Alignment

- **Mediator**: 1st-tier Intermediary tenants (`parent_id = MasterTenant.id`) operating directly under SuperAdmin, managing sub-tenant trading networks.
- **Virtual Buyer**: `buyer_with_quota` (Entity/Tenant holding regulatory allocation quota to purchase regulated commodities).
- **Virtual Seller**: `virtual_seller` (Entity/Tenant holding regulatory quota allocations to sell/release commodities).
- **Actual Seller**: `actual_supplier` (Physical commodity producer, mill, or importer).
- **Actual Buyer**: `standard_buyer` (Downstream commercial buyer/wholesaler/retailer).

## Not yet done / open items

- Re-enable the scheduler task once confident the boot crash is resolved.
- End-to-end login test with seeded credentials hasn't been performed yet.
- `config/hashing.php` doesn't exist despite the doc claiming Argon2id — Bcrypt
  default is in effect. Worth reconciling doc vs. actual if hashing algorithm matters.
