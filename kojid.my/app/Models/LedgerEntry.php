<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

/**
 * App\Models\LedgerEntry
 *
 * Double-entry bookkeeping record. IMMUTABLE — DB triggers prevent UPDATE/DELETE.
 * Model-level boot hook provides an additional guard layer.
 * Corrections must be made via reversal entries (LedgerService::reverse()).
 */
class LedgerEntry extends Model
{
    // No updated_at — append-only table
    const UPDATED_AT = null;

    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'transaction_ref', 'account_code',
        'dr_amount', 'cr_amount', 'currency', 'narrative',
        'order_id', 'deposit_id', 'settlement_id',
        'initiated_by', 'posted_at',
    ];

    protected $casts = [
        'dr_amount'  => 'decimal:2',
        'cr_amount'  => 'decimal:2',
        'posted_at'  => 'datetime',
    ];

    protected static function booted(): void
    {
        static::updating(function () {
            throw new \RuntimeException('LedgerEntry records are immutable. Use LedgerService::reverse() to correct.');
        });
        static::deleting(function () {
            throw new \RuntimeException('LedgerEntry records cannot be deleted. Immutable audit record.');
        });
    }

    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function deposit(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Deposit::class);
    }

    public function settlement(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Settlement::class);
    }

    public function initiatedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'initiated_by');
    }

    public function getAccountName(): string
    {
        return config('kojid.accounts.' . $this->account_code, 'Unknown Account');
    }

    /**
     * Get posted_at converted to MYT for display.
     */
    public function getPostedAtMytAttribute(): \Carbon\Carbon
    {
        return $this->posted_at->setTimezone('Asia/Kuala_Lumpur');
    }

    public function scopeVisibleTo(\Illuminate\Database\Eloquent\Builder $query, User $user): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        if ($user->isEntityUser()) {
            $entityId = $user->entity_id ?? 0;
            $query->where(function ($q) use ($entityId) {
                $q->whereHas('order', function ($orderQuery) use ($entityId) {
                    $orderQuery->where('entity_id', $entityId)
                        ->orWhere('quota_holder_entity_id', $entityId);
                })->orWhereHas('deposit', fn ($depositQuery) => $depositQuery->where('entity_id', $entityId));
            });
            return;
        }

        $query->where('tenant_id', $user->tenant_id);
    }
}
