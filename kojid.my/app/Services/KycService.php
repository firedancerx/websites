<?php

namespace App\Services;

use App\Models\Entity;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * KycService
 *
 * Manages KYC (Know Your Customer) verification for entities.
 * Handles document upload, verification approval, and blacklisting.
 * Unverified entities are capped at RM 5,000 cumulative transactions.
 */
class KycService
{
    /**
     * Upload a KYC document for an entity.
     *
     * @param  Entity       $entity
     * @param  UploadedFile $file    SSM cert, IC, bank statement, etc.
     * @param  string       $docType 'ssm' | 'ic' | 'bank_statement' | 'other'
     * @return string               Stored path
     */
    public function uploadDocument(Entity $entity, UploadedFile $file, string $docType): string
    {
        $path = $file->store(
            "kyc/{$entity->tenant_id}/{$entity->id}",
            'private'
        );

        $docs   = $entity->kyc_documents ?? [];
        $docs[] = [
            'type'        => $docType,
            'path'        => $path,
            'filename'    => $file->getClientOriginalName(),
            'uploaded_at' => now()->toIso8601String(),
        ];

        $entity->update(['kyc_documents' => $docs]);

        return $path;
    }

    /**
     * Approve KYC and mark entity as verified.
     *
     * @param  Entity $entity
     * @param  User   $approver  Must have 'tenant_admin' role
     * @throws \RuntimeException if approver lacks permission
     */
    public function approve(Entity $entity, User $approver): void
    {
        if (! $approver->hasRole(['tenant_admin', 'super_admin'])) {
            throw new \RuntimeException('Only tenant admins can approve KYC.');
        }

        $entity->update([
            'verified_at' => now(),
            'verified_by' => $approver->id,
        ]);
    }

    /**
     * Blacklist an entity — prevents all future transactions.
     *
     * @param  Entity $entity
     * @param  string $reason   Mandatory reason for audit trail
     * @param  User   $blacklistedBy
     */
    public function blacklist(Entity $entity, string $reason, User $blacklistedBy): void
    {
        if (empty(trim($reason))) {
            throw new \InvalidArgumentException('Blacklist reason is mandatory.');
        }

        $entity->update([
            'is_blacklisted'   => true,
            'blacklist_reason' => $reason,
            'blacklisted_at'   => now(),
        ]);
    }

    /**
     * Remove an entity from the blacklist.
     *
     * @param  Entity $entity
     * @param  User   $unblacklistedBy  Must be tenant_admin
     */
    public function unblacklist(Entity $entity, User $unblacklistedBy): void
    {
        if (! $unblacklistedBy->hasRole('tenant_admin')) {
            throw new \RuntimeException('Only tenant admins can remove a blacklist.');
        }

        $entity->update([
            'is_blacklisted'   => false,
            'blacklist_reason' => null,
            'blacklisted_at'   => null,
        ]);
    }

    /**
     * Check whether an entity can transact at the given order amount.
     * Throws exception with human-readable reason if not allowed.
     *
     * @throws \RuntimeException
     */
    public function assertCanTransact(Entity $entity, \Brick\Money\Money $orderAmount): void
    {
        if ($entity->is_blacklisted) {
            throw new \RuntimeException(
                __('entities.blacklisted_cannot_transact', ['name' => $entity->name])
            );
        }

        if (! $entity->canTransact($orderAmount)) {
            $threshold = config('kojid.deposits.unverified_max_cumulative');
            throw new \RuntimeException(
                __('entities.kyc_threshold_exceeded', [
                    'name'      => $entity->name,
                    'threshold' => 'RM ' . number_format($threshold, 2),
                ])
            );
        }
    }
}
