<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use App\Traits\HasAuditTrail;

/**
 * App\Models\Entity
 *
 * An SSM-registered legal trading counterparty.
 * Implements the Quantum Actor model — one entity can hold multiple roles
 * simultaneously (supplier, buyer, quota_holder, intermediary) depending
 * on transaction context. Role resolution is via entity_roles table.
 *
 * @property int         $id
 * @property int         $tenant_id
 * @property string      $name
 * @property string      $ssm_number
 * @property string|null $ic_owner
 * @property string      $entity_type      Primary/default type
 * @property string      $credit_terms
 * @property float|null  $deposit_rate_override
 * @property bool        $is_blacklisted
 */
class Entity extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, HasAuditTrail;

    protected $fillable = [
        'tenant_id', 'name', 'ssm_number', 'ic_owner', 'entity_type',
        'bank_account', 'bank_name', 'bank_swift',
        'contact_phone', 'contact_email', 'address',
        'credit_terms', 'credit_days', 'credit_limit',
        'deposit_rate_override', 'verified_at', 'verified_by',
        'is_blacklisted', 'blacklist_reason', 'blacklisted_at',
        'kyc_documents', 'notes',
    ];

    protected $casts = [
        'verified_at'           => 'datetime',
        'blacklisted_at'        => 'datetime',
        'is_blacklisted'        => 'boolean',
        'kyc_documents'         => 'array',
        'deposit_rate_override' => 'decimal:2',
        'credit_limit'          => 'decimal:2',
        'credit_days'           => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function roles(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(EntityRole::class);
    }

    public function activeRoles(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(EntityRole::class)->whereNull('revoked_at');
    }

    public function verifiedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function inboundOrders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class, 'entity_id')->where('type', 'inbound');
    }

    public function outboundOrders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class, 'entity_id')->where('type', 'outbound');
    }

    public function deposits(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Deposit::class);
    }

    // -------------------------------------------------------------------------
    // Quantum Actor Helpers
    // -------------------------------------------------------------------------

    /**
     * Check if this entity currently holds a specific role (not revoked).
     */
    public function hasActiveRole(string $role): bool
    {
        return $this->activeRoles()->where('role', $role)->exists();
    }

    /**
     * Get all active role names for this entity.
     *
     * @return array<string>
     */
    public function getActiveRoleNames(): array
    {
        return $this->activeRoles()->pluck('role')->toArray();
    }

    // -------------------------------------------------------------------------
    // KYC & Business Logic
    // -------------------------------------------------------------------------

    /**
     * Whether this entity has passed KYC verification.
     */
    public function isVerified(): bool
    {
        return $this->verified_at !== null;
    }

    /**
     * Get effective deposit rate: entity override → tenant default.
     */
    public function getEffectiveDepositRate(): float
    {
        if ($this->deposit_rate_override !== null) {
            return (float) $this->deposit_rate_override;
        }

        return $this->tenant->getDefaultDepositRate();
    }

    /**
     * Get cumulative transacted amount for KYC threshold check.
     */
    public function getCumulativeTransactionAmount(): \Brick\Money\Money
    {
        $total = $this->outboundOrders()
            ->whereNotIn('status', ['CANCELLED', 'CANCELLED_FORFEITED'])
            ->sum('total_amount');

        return \Brick\Money\Money::of((string) $total, 'MYR');
    }

    /**
     * Whether this entity can transact (not blacklisted, meets KYC threshold).
     */
    public function canTransact(\Brick\Money\Money $orderAmount): bool
    {
        if ($this->is_blacklisted) {
            return false;
        }

        if (! $this->isVerified()) {
            $threshold    = \Brick\Money\Money::of((string) config('kojid.deposits.unverified_max_cumulative'), 'MYR');
            $currentTotal = $this->getCumulativeTransactionAmount();

            if ($currentTotal->plus($orderAmount)->isGreaterThan($threshold)) {
                return false;
            }
        }

        return true;
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeVerified(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->whereNotNull('verified_at');
    }

    public function scopeNotBlacklisted(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('is_blacklisted', false);
    }

    public function scopeVisibleTo(\Illuminate\Database\Eloquent\Builder $query, User $user): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        if ($user->isEntityUser()) {
            $query->whereKey($user->entity_id ?? 0);
            return;
        }

        $query->where('tenant_id', $user->tenant_id);
    }
}
