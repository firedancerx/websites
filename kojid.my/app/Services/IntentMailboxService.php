<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class IntentMailboxService
{
    /**
     * Send an intent from sender tenant to recipient tenant.
     * Enforces routing rules:
     * - Non-mediators can ONLY send to their Upline Mediator.
     * - Mediators can ONLY send to sub-tenants within their ecosystem (inter-mediator intents BLOCKED).
     * - Mandatory subsidy proof for VS & VB in QUOTA_SUBSIDIZED mode.
     */
    public function sendIntent(array $data): array
    {
        $senderTenant = DB::table('tenants')->where('id', $data['sender_tenant_id'])->first();
        $recipientTenant = DB::table('tenants')->where('id', $data['recipient_tenant_id'])->first();

        if (!$senderTenant || !$recipientTenant) {
            throw new InvalidArgumentException("Invalid sender or recipient tenant ID.");
        }

        // Routing Rules Enforcement
        if ($senderTenant->tenant_type !== 'mediator') {
            if ($senderTenant->upline_mediator_id != $recipientTenant->id) {
                throw new InvalidArgumentException("SECURITY VIOLATION: Non-mediating tenants can ONLY send intents to their appointed Upline Mediator.");
            }
        } else {
            if ($recipientTenant->tenant_type === 'mediator') {
                throw new InvalidArgumentException("SECURITY VIOLATION: Inter-Mediator intents are BLOCKED.");
            }
        }

        // Subsidy Proof Validation for VS & VB in QUOTA_SUBSIDIZED mode
        if ($data['trade_mode'] === 'QUOTA_SUBSIDIZED' && in_array($senderTenant->tenant_type, ['virtual_seller', 'buyer_with_quota'])) {
            if (empty($data['subsidy_picture_path'])) {
                throw new InvalidArgumentException("MANDATORY PROOF REQUIRED: Virtual Sellers and Virtual Buyers must upload a picture of their subsidy permit.");
            }
        }

        DB::beginTransaction();
        try {
            // 1. Create Sender's SENT copy
            $sentId = DB::table('intent_mailbox_entries')->insertGetId([
                'tenant_id' => $data['sender_tenant_id'],
                'folder' => 'SENT',
                'sender_tenant_id' => $data['sender_tenant_id'],
                'recipient_tenant_id' => $data['recipient_tenant_id'],
                'intent_code' => $data['intent_code'],
                'intent_status' => 'PENDING_DECISION',
                'subsidy_picture_path' => $data['subsidy_picture_path'] ?? null,
                'editable' => false,
                'remarks' => $data['remarks'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Create Recipient's INBOX copy
            $inboxId = DB::table('intent_mailbox_entries')->insertGetId([
                'tenant_id' => $data['recipient_tenant_id'],
                'folder' => 'INBOX',
                'sender_tenant_id' => $data['sender_tenant_id'],
                'recipient_tenant_id' => $data['recipient_tenant_id'],
                'intent_code' => $data['intent_code'],
                'intent_status' => 'PENDING_DECISION',
                'subsidy_picture_path' => $data['subsidy_picture_path'] ?? null,
                'editable' => false,
                'remarks' => $data['remarks'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();

            return [
                'sent_entry_id' => $sentId,
                'inbox_entry_id' => $inboxId,
                'intent_code' => $data['intent_code'],
                'status' => 'PENDING_DECISION'
            ];
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
