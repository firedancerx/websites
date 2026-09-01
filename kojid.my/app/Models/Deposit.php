<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use App\Traits\HasAuditTrail;
use Brick\Money\Money;

/**
 * App\Models\Deposit
 *
 * Tracks deposit lifecycle: PENDING → RECEIVED → APPLIED | FORFEITED | REFUNDED
 * Refund requires dual approval: tenant_admin + finance_officer.
 * Uses optimistic locking (version column) to prevent concurrent mutations.
 *
 * @property int     $id
 * @property string  $status    PENDING|RECEIVED|APPLIED|FORFEITED|REFUNDED
 * @property string  $amount    DECIMAL(15,2) — use Money::of() to work with this
 * @property int     $version   Optimistic locking version
 */
class Deposit extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, HasAuditTrail;

    const STATUS_PENDING   = 'PENDING';
    const STATUS_RECEIVED  = 'RECEIVED';
    const STATUS_APPLIED   = 'APPLIED';
    const STATUS_FORFEITED = 'FORFEITED';
    const STATUS_REFUNDED  = 'REFUNDED';

    protected $fillable = [
        'tenant_id', 'order_id', 'entity_id',
        'amount', 'rate', 'status',
        'reference', 'payment_method',
        'received_at', 'applied_at', 'forfeited_at',
        'refund_requested_at', 'refund_approved_at', 'refunded_at',
        'refund_requested_by', 'refund_approved_by', 'refund_finance_approved_by',
        'refund_finance_approved_at',
        'refund_reason', 'forfeiture_reason',
        'version',
    ];

    protected $casts = [
        'amount'                    => 'decimal:2',
        'rate'                      => 'decimal:2',
        'received_at'               => 'datetime',
        'applied_at'                => 'datetime',
        'forfeited_at'              => 'datetime',
        'refund_requested_at'       => 'datetime',
        'refund_approved_at'        => 'datetime',
        'refunded_at'               => 'datetime',
        'refund_finance_approved_at' => 'datetime',
        'version'                   => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function entity(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    public function refundRequestedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'refund_requested_by');
    }

    public function refundApprovedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'refund_approved_by');
    }

    public function refundFinanceApprovedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'refund_finance_approved_by');
    }

    public function ledgerEntries(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LedgerEntry::class);
    }

    // -------------------------------------------------------------------------
    // Money helpers
    // -------------------------------------------------------------------------

    /**
     * Get amount as a type-safe Money object (never float).
     */
    public function getMoney(): Money
    {
        return Money::of((string) $this->amount, 'MYR');
    }

    // -------------------------------------------------------------------------
    // Dual-approval refund workflow
    // -------------------------------------------------------------------------

    /**
     * First approval step: tenant admin approves refund request.
     */
    public function approveRefund(User $approver): void
    {
        $this->update([
            'refund_approved_by' => $approver->id,
            'refund_approved_at' => now(),
        ]);
    }

    /**
     * Second approval step: finance officer completes refund approval.
     */
    public function financeApproveRefund(User $financeOfficer): void
    {
        $this->update([
            'refund_finance_approved_by' => $financeOfficer->id,
            'refund_finance_approved_at' => now(),
        ]);
    }

    /**
     * Whether refund has received both required approvals.
     */
    public function hasFullRefundApproval(): bool
    {
        return $this->refund_approved_by !== null
            && $this->refund_finance_approved_by !== null;
    }

    // -------------------------------------------------------------------------
    // Optimistic locking
    // -------------------------------------------------------------------------

    /**
     * Save with optimistic lock check. Throws on stale version.
     *
     * @throws \App\Exceptions\StaleDataException
     */
    public function saveWithLock(array $attributes = []): bool
    {
        $expectedVersion = $this->version ?? 1;
        $newVersion      = $expectedVersion + 1;

        $updated = static::where('id', $this->id)
                         ->where('version', $expectedVersion)
                         ->update(array_merge($attributes, ['version' => $newVersion]));

        if ($updated === 0) {
            throw new \App\Exceptions\StaleDataException(
                "Deposit #{$this->id} was modified by another process. Please refresh and retry."
            );
        }

        $this->fill(array_merge($attributes, ['version' => $newVersion]));
        return true;
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopePending(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('status', self::STATUS_PENDING);
    }

    public function scopeReceived(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('status', self::STATUS_RECEIVED);
    }

    public function scopeForfeited(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('status', self::STATUS_FORFEITED);
    }

    public function scopePendingRefund(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->whereNotNull('refund_requested_at')
              ->whereNull('refunded_at')
              ->where('status', self::STATUS_RECEIVED);
    }

    public function scopeVisibleTo(\Illuminate\Database\Eloquent\Builder $query, User $user): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        if ($user->isEntityUser()) {
            $query->where('entity_id', $user->entity_id ?? 0);
            return;
        }

        $query->where('tenant_id', $user->tenant_id);
    }
}
