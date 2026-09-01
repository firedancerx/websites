<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TransactionUniverseSeeder extends Seeder
{
    /**
     * Run the transaction universe database seeder.
     * Seeds 300 complete & incomplete transactions across QUOTA_SUBSIDIZED and NORMAL_COMMERCIAL modes.
     */
    public function run(): void
    {
        $mediatorId = 1; // Primary Mediator: Demo Trading Sdn Bhd

        // Fetch sub-tenants
        $subTenants = DB::table('tenants')->where('id', '>', 1)->pluck('id')->toArray();
        if (empty($subTenants)) {
            $subTenants = [$mediatorId];
        }

        // Available merchandise codes
        $merchandiseCodes = ['2000-0001', '2000-0002', '2000-0003', '2000-0004', '2000-0005'];

        // 1. Seed Service Provider Masters & Bank Accounts if missing
        $serviceProviderId = DB::table('service_provider_masters')->insertGetId([
            'tenant_id' => $mediatorId,
            'provider_code' => '7000-LOG01',
            'provider_name' => 'Kuantan Freight & Logistics Logistics Sdn Bhd',
            'service_category' => 'LOGISTICS',
            'ssm_registration_no' => '202101088712',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('bank_accounts')->insertOrIgnore([
            'tenant_id' => $mediatorId,
            'account_code' => '1000-MBB01',
            'bank_name' => 'Maybank Islamic Berhad',
            'account_number' => '514012399102',
            'opening_balance' => 500000.0000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        echo "Seeding 300 Transactions (150 QUOTA_SUBSIDIZED / 150 NORMAL_COMMERCIAL)..." . PHP_EOL;

        // Total 300 transactions
        for ($i = 1; $i <= 300; $i++) {
            $tradeMode = ($i <= 150) ? 'QUOTA_SUBSIDIZED' : 'NORMAL_COMMERCIAL';
            $intentCode = sprintf("INT-2026-%04d", $i);
            $merchCode = $merchandiseCodes[$i % count($merchandiseCodes)];
            
            // Random sub-tenants
            $asTenantId = $subTenants[$i % count($subTenants)];
            $abTenantId = $subTenants[($i + 1) % count($subTenants)];
            $vsTenantId = $subTenants[($i + 2) % count($subTenants)];
            $vbTenantId = $subTenants[($i + 3) % count($subTenants)];

            $qty = 1000.0000;
            $asPrice = 3.5000;
            $abPrice = 4.8000;
            $vsFee = ($tradeMode === 'QUOTA_SUBSIDIZED') ? 0.3500 : 0.0000;
            $vbFee = ($tradeMode === 'QUOTA_SUBSIDIZED') ? 0.2500 : 0.0000;

            // Determine Lifecycle Stage
            // Completed: 1..150
            // Stage 1 (Pending): 151..180
            // Stage 2 (Returned): 181..210
            // Stage 3 (Approved Awaiting Delivery): 211..240
            // Stage 4 (Partial Delivery): 241..270
            // Stage 5 (Delivery Complete Unpaid): 271..300
            if ($i <= 150) {
                $stage = 'COMPLETED';
            } elseif ($i <= 180) {
                $stage = 'PENDING_DECISION';
            } elseif ($i <= 210) {
                $stage = 'RETURNED_WITH_REMARKS';
            } elseif ($i <= 240) {
                $stage = 'APPROVED_AWAITING_DELIVERY';
            } elseif ($i <= 270) {
                $stage = 'PARTIAL_DELIVERY_INWARDS';
            } else {
                $stage = 'DELIVERY_COMPLETE_UNPAID';
            }

            // Quota Master (for Quota Mode)
            $quotaNum = sprintf("QTA-2026-%04d", $i);
            $quotaMasterId = DB::table('quota_masters')->insertGetId([
                'tenant_id' => $mediatorId,
                'quota_number' => $quotaNum,
                'vb_entity_id' => 1,
                'vs_entity_id' => 1,
                'total_qty' => $qty,
                'commodity_type' => 'COOKING_OIL_BULK',
                'status' => 'ACTIVE',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Price History
            DB::table('merchandise_price_histories')->insert([
                'tenant_id' => $mediatorId,
                'merchandise_code' => $merchCode,
                'trade_mode' => $tradeMode,
                'as_purchase_price' => $asPrice,
                'ab_sales_price' => $abPrice,
                'vs_quota_fee' => $vsFee,
                'vb_quota_fee' => $vbFee,
                'effective_at' => now()->subDays(30),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $subsidyPath = ($tradeMode === 'QUOTA_SUBSIDIZED') ? "storage/subsidies/permit_vs_{$i}.jpg" : null;
            $appStatus = in_array($stage, ['PENDING_DECISION', 'RETURNED_WITH_REMARKS']) ? $stage : 'APPROVED';
            $postStatus = ($stage === 'COMPLETED') ? 'POSTED' : 'UNPOSTED';

            // 1. Transaction Intent
            $intentId = DB::table('transaction_intents')->insertGetId([
                'tenant_id' => $mediatorId,
                'intent_code' => $intentCode,
                'trade_mode' => $tradeMode,
                'merchandise_code' => $merchCode,
                'quantity' => $qty,
                'purchase_price_as' => $asPrice,
                'sales_price_ab' => $abPrice,
                'quota_fee_vs' => $vsFee,
                'quota_fee_vb' => $vbFee,
                'subsidy_picture_path' => $subsidyPath,
                'approval_status' => $appStatus,
                'posting_status' => $postStatus,
                'effective_start_date' => now()->subDays(10),
                'effective_end_date' => now()->addDays(20),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Intent Mailbox Entries
            $folder = ($stage === 'RETURNED_WITH_REMARKS') ? 'DRAFT' : (($stage === 'PENDING_DECISION') ? 'INBOX' : 'SENT');
            DB::table('intent_mailbox_entries')->insert([
                'tenant_id' => $mediatorId,
                'folder' => $folder,
                'sender_tenant_id' => $vsTenantId,
                'recipient_tenant_id' => $mediatorId,
                'intent_code' => $intentCode,
                'intent_status' => $appStatus,
                'subsidy_picture_path' => $subsidyPath,
                'editable' => ($stage === 'RETURNED_WITH_REMARKS'),
                'remarks' => ($stage === 'RETURNED_WITH_REMARKS') ? 'Please adjust selling price.' : null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Stop here for Stage 1 & Stage 2 (Unapproved Intents)
            if (in_array($stage, ['PENDING_DECISION', 'RETURNED_WITH_REMARKS'])) {
                continue;
            }

            // 3. Contractual Documents Generation (4 Contracts for Quota, 2 for Normal)
            $poDocId = DB::table('contractual_documents')->insertGetId([
                'mediator_tenant_id' => $mediatorId,
                'trade_mode' => $tradeMode,
                'intent_code' => $intentCode,
                'doc_no' => sprintf("MSK-PO-2026-%04d", $i),
                'doc_name' => 'Purchase Order (MSK Inbound)',
                'doc_type' => 'PURCHASE_ORDER',
                'recipient_tenant_id' => $asTenantId,
                'is_selected' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $soDocId = DB::table('contractual_documents')->insertGetId([
                'mediator_tenant_id' => $mediatorId,
                'trade_mode' => $tradeMode,
                'intent_code' => $intentCode,
                'doc_no' => sprintf("KLR-SO-2026-%04d", $i),
                'doc_name' => 'Sales Order (KLR Outbound)',
                'doc_type' => 'SALES_ORDER',
                'recipient_tenant_id' => $abTenantId,
                'is_selected' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($tradeMode === 'QUOTA_SUBSIDIZED') {
                DB::table('contractual_documents')->insert([
                    'mediator_tenant_id' => $mediatorId,
                    'trade_mode' => $tradeMode,
                    'intent_code' => $intentCode,
                    'doc_no' => sprintf("VS-PPO-2026-%04d", $i),
                    'doc_name' => 'Proforma Purchase Order',
                    'doc_type' => 'PROFORMA_PO',
                    'recipient_tenant_id' => $vsTenantId,
                    'is_selected' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                DB::table('contractual_documents')->insert([
                    'mediator_tenant_id' => $mediatorId,
                    'trade_mode' => $tradeMode,
                    'intent_code' => $intentCode,
                    'doc_no' => sprintf("VB-PSO-2026-%04d", $i),
                    'doc_name' => 'Proforma Sales Order',
                    'doc_type' => 'PROFORMA_SO',
                    'recipient_tenant_id' => $vbTenantId,
                    'is_selected' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Stop here for Stage 3 (Approved Awaiting Delivery)
            if ($stage === 'APPROVED_AWAITING_DELIVERY') {
                continue;
            }

            // 4. Inbound Delivery Receipts
            $deliveredQty = ($stage === 'PARTIAL_DELIVERY_INWARDS') ? 400.0000 : $qty;
            $inboundStatus = ($stage === 'PARTIAL_DELIVERY_INWARDS') ? 'PARTIAL_DELIVERY_INWARDS' : 'DELIVERY_INWARDS_COMPLETE';

            DB::table('inbound_delivery_receipts')->insert([
                'tenant_id' => $mediatorId,
                'po_document_id' => $poDocId,
                'receipt_date' => now()->subDays(3),
                'accepted_qty' => $deliveredQty,
                'unit_cost' => $asPrice,
                'cumulative_received_qty' => $deliveredQty,
                'total_po_qty' => $qty,
                'status' => $inboundStatus,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 5. Inventory Movement (AVCO)
            $balQty = $deliveredQty;
            $balVal = $deliveredQty * $asPrice;
            $avco = $asPrice;

            DB::table('merchandise_inventory_transactions')->insert([
                'tenant_id' => $mediatorId,
                'merchandise_code' => $merchCode,
                'doc_ref_no' => sprintf("MSK-PO-2026-%04d", $i),
                'quota_id' => $quotaNum,
                'in_qty' => $deliveredQty,
                'out_qty' => 0.0000,
                'balance_qty' => $balQty,
                'balance_value' => $balVal,
                'weighted_avg_cost' => $avco,
                'notes' => "Inbound product receipt for INT-2026-{$i}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 6. Delivery Orders & Invoices
            $mskDoId = DB::table('delivery_orders')->insertGetId([
                'tenant_id' => $mediatorId,
                'do_number' => sprintf("MSK-DO-2026-%04d", $i),
                'do_type' => 'MSK_INWARD_DO',
                'po_so_document_id' => $poDocId,
                'counterparty_tenant_id' => $asTenantId,
                'delivery_date' => now()->subDays(3),
                'delivered_qty' => $deliveredQty,
                'status' => 'CONFIRMED',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $klrDoId = DB::table('delivery_orders')->insertGetId([
                'tenant_id' => $mediatorId,
                'do_number' => sprintf("KLR-DO-2026-%04d", $i),
                'do_type' => 'KLR_OUTWARD_DO',
                'po_so_document_id' => $soDocId,
                'counterparty_tenant_id' => $abTenantId,
                'delivery_date' => now()->subDays(2),
                'delivered_qty' => $deliveredQty,
                'status' => 'CONFIRMED',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $payStatus = ($stage === 'COMPLETED') ? 'PAID' : 'UNPAID';
            $isImm = ($stage === 'COMPLETED');

            DB::table('invoices')->insert([
                'tenant_id' => $mediatorId,
                'invoice_number' => sprintf("MSK-INV-2026-%04d", $i),
                'invoice_type' => 'MSK_INWARD_INV',
                'delivery_order_id' => $mskDoId,
                'counterparty_tenant_id' => $asTenantId,
                'invoice_date' => now()->subDays(3),
                'delivered_qty' => $deliveredQty,
                'invoice_amount' => $deliveredQty * $asPrice,
                'vendor_invoice_image_path' => "storage/invoices/vendor_inv_{$i}.pdf",
                'is_final_batch' => ($stage !== 'PARTIAL_DELIVERY_INWARDS'),
                'payment_status' => $payStatus,
                'is_immutable' => $isImm,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('invoices')->insert([
                'tenant_id' => $mediatorId,
                'invoice_number' => sprintf("KLR-INV-2026-%04d", $i),
                'invoice_type' => 'KLR_OUTWARD_INV',
                'delivery_order_id' => $klrDoId,
                'counterparty_tenant_id' => $abTenantId,
                'invoice_date' => now()->subDays(2),
                'delivered_qty' => $deliveredQty,
                'invoice_amount' => $deliveredQty * $abPrice,
                'vendor_invoice_image_path' => null,
                'is_final_batch' => ($stage !== 'PARTIAL_DELIVERY_INWARDS'),
                'payment_status' => $payStatus,
                'is_immutable' => $isImm,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Stop here for Stage 4 & Stage 5 (Unpaid Invoices)
            if ($stage !== 'COMPLETED') {
                continue;
            }

            // 7. Payment Valuation Register & P&L Statement (Completed Transactions)
            $asVal = $deliveredQty * $asPrice;
            $abVal = $deliveredQty * $abPrice;
            $vsVal = $deliveredQty * $vsFee;
            $vbVal = $deliveredQty * $vbFee;

            DB::table('payment_valuation_registers')->insert([
                'tenant_id' => $mediatorId,
                'quota_master_id' => $quotaNum,
                'payment_date' => now()->subDay(),
                'as_val' => $asVal,
                'vs_val' => $vsVal,
                'vb_val' => $vbVal,
                'ab_val' => -$abVal,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $salesRev = $abVal;
            $cogsAvco = $asVal;
            $gtp = $salesRev - $cogsAvco;
            $opex = 100.0000;
            $noi = $gtp - $opex;
            $quotaSubtotal = $vsVal + $vbVal;
            $netShipmentProfit = $noi - $quotaSubtotal;

            DB::table('shipment_pl_statement_registers')->insert([
                'tenant_id' => $mediatorId,
                'shipment_ref_no' => sprintf("SHP-2026-%04d", $i),
                'merchandise_code' => $merchCode,
                'sales_revenue' => $salesRev,
                'cogs_avco' => $cogsAvco,
                'gtp' => $gtp,
                'opex_subtotal' => $opex,
                'noi' => $noi,
                'quota_fees_subtotal' => $quotaSubtotal,
                'net_shipment_profit' => $netShipmentProfit,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 8. Cashbook & Bank Reconciliation Entries
            DB::table('cash_at_bank_transactions')->insert([
                'tenant_id' => $mediatorId,
                'bank_id' => '1000-MBB01',
                'date' => now()->subDay(),
                'pv_or_no' => sprintf("OR-2026-%04d", $i),
                'ref_no' => sprintf("KLR-INV-2026-%04d", $i),
                'quota_id' => $quotaNum,
                'counterparty_tenant_no' => $abTenantId,
                'transaction_category' => 'TRADE_COLLECTION',
                'amount' => $salesRev,
                'reconciliation_status' => 'RECONCILED',
                'reconciled_date' => now(),
                'bank_statement_ref' => "STMT-AUG2026-P{$i}",
                'statement_date' => now()->format('Y-m-d'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('cash_at_bank_transactions')->insert([
                'tenant_id' => $mediatorId,
                'bank_id' => '1000-MBB01',
                'date' => now()->subDay(),
                'pv_or_no' => sprintf("PV-2026-%04d", $i),
                'ref_no' => sprintf("MSK-INV-2026-%04d", $i),
                'quota_id' => $quotaNum,
                'counterparty_tenant_no' => $asTenantId,
                'transaction_category' => 'SUPPLIER_PAYMENT',
                'amount' => -$asVal,
                'reconciliation_status' => 'RECONCILED',
                'reconciled_date' => now(),
                'bank_statement_ref' => "STMT-AUG2026-P{$i}",
                'statement_date' => now()->format('Y-m-d'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        echo "SUCCESSFULLY SEEDED 300 TRANSACTIONS ACROSS ALL LIFECYCLE STAGES AND TRADING MODES!" . PHP_EOL;
    }
}
