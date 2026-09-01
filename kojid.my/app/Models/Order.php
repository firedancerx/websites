<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use App\Traits\HasAuditTrail;
use App\Traits\HasOrderNumber;
use App\Exceptions\InvalidStateTransitionException;

/**
 * App\Models\Order
 *
 * Two-leg transaction model (Dua-Lejang).
 * - type=inbound  → Leg 1: Tenant buys from supplier (risk acquisition)
 * - type=outbound → Leg 2: Tenant sells to buyer (risk release)
 *
 * CRITICAL: Never update $order->status directly.
 * All transitions MUST go through OrderStateMachineService.
 * Direct status updates throw InvalidStateTransitionException.
 *
 * @property int         $id
 * @property int         $tenant_id
 * @property string      $order_number
 * @property string      $type          'inbound' | 'outbound'
 * @property string      $status
 * @property int         $entity_id
 * @property float       $total_amount
 * @property float       $deposit_rate
 * @property float       $deposit_amount
 * @property int         $version       Optimistic locking
 */
class Order extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, HasAuditTrail, HasOrderNumber;

    // -------------------------------------------------------------------------
    // State constants — inbound
    // -------------------------------------------------------------------------
    const INBOUND_CREATED            = 'CREATED';
    const INBOUND_PENDING_ACCEPTANCE = 'PENDING_ACCEPTANCE';
    const INBOUND_DEPOSIT_COMMITTED  = 'DEPOSIT_COMMITTED';
    const INBOUND_PENDING_DELIVERY   = 'PENDING_DELIVERY';
    const INBOUND_RECEIVED_STOCKED   = 'RECEIVED_STOCKED';
    const INBOUND_RISK_ACQUIRED      = 'RISK_ACQUIRED';
    const INBOUND_CANCELLED          = 'CANCELLED';
    const INBOUND_CANCELLED_FORFEITED = 'CANCELLED_FORFEITED';

    // -------------------------------------------------------------------------
    // State constants — outbound
    // -------------------------------------------------------------------------
    const OUTBOUND_CREATED               = 'CREATED';
    const OUTBOUND_PENDING_BUYER_DEPOSIT = 'PENDING_BUYER_DEPOSIT';
    const OUTBOUND_DEPOSIT_CONFIRMED     = 'DEPOSIT_CONFIRMED';
    const OUTBOUND_PENDING_DISPATCH      = 'PENDING_DISPATCH';
    const OUTBOUND_IN_TRANSIT            = 'IN_TRANSIT';
    const OUTBOUND_DELIVERED             = 'DELIVERED';
    const OUTBOUND_SETTLED               = 'SETTLED';
    const OUTBOUND_DISPUTED              = 'DISPUTED';
    const OUTBOUND_ADJUSTED              = 'ADJUSTED';
    const OUTBOUND_CANCELLED_FORFEITED   = 'CANCELLED_FORFEITED';

    /**
     * Terminal states — orders in these states cannot be transitioned further.
     */
    const TERMINAL_STATES = [
        'RISK_ACQUIRED',
        'SETTLED',
        'ADJUSTED',
        'CANCELLED',
        'CANCELLED_FORFEITED',
    ];

    protected $fillable = [
        'tenant_id', 'order_number', 'type', 'status',
        'entity_id', 'entity_role_snapshot',
        'quota_holder_entity_id', 'settlement_type',
        'total_amount', 'deposit_rate', 'deposit_amount',
        'payment_terms', 'payment_days',
        'sla_deadline_at', 'guillotina_triggered_at',
        'aggregation_batch_id',
        'notes', 'dispute_reason', 'disputed_at', 'settled_at',
        'created_by', 'last_updated_by', 'version',
    ];

    protected $casts = [
        'entity_role_snapshot'    => 'array',
        'total_amount'            => 'decimal:2',
        'deposit_rate'            => 'decimal:2',
        'deposit_amount'          => 'decimal:2',
        'sla_deadline_at'         => 'datetime',
        'guillotina_triggered_at' => 'datetime',
        'disputed_at'             => 'datetime',
        'settled_at'              => 'datetime',
        'version'                 => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Boot — protect status from direct mutation
    // -------------------------------------------------------------------------

    protected static function booted(): void
    {
        static::updating(function (Order $order) {
            // If status is being changed and it's not via the state machine flag, block it
            if ($order->isDirty('status') && ! $order->getStateTransitionAllowed()) {
                throw new InvalidStateTransitionException(
                    'Direct status updates are forbidden. Use OrderStateMachineService::transition().'
                );
            }
        });
    }

    /** Internal flag set ONLY by OrderStateMachineService */
    private bool $stateTransitionAllowed = false;

    public function allowStateTransition(): void
    {
        $this->stateTransitionAllowed = true;
    }

    public function getStateTransitionAllowed(): bool
    {
        return $this->stateTransitionAllowed;
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function entity(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    public function quotaHolder(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Entity::class, 'quota_holder_entity_id');
    }

    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function stateLogs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrderStateLog::class)->orderBy('triggered_at', 'asc');
    }

    public function deposit(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Deposit::class)->latestOfMany();
    }

    public function deposits(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Deposit::class);
    }

    public function settlement(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Settlement::class);
    }

    public function ledgerEntries(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(LedgerEntry::class);
    }

    public function aggregationBatch(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(AggregationBatch::class);
    }

    public function createdBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // -------------------------------------------------------------------------
    // State helpers
    // -------------------------------------------------------------------------

    public function isInTerminalState(): bool
    {
        return in_array($this->status, self::TERMINAL_STATES, true);
    }

    public function isGuillotinaCandidate(): bool
    {
        return $this->sla_deadline_at !== null
            && $this->sla_deadline_at->isPast()
            && ! $this->isInTerminalState()
            && $this->guillotina_triggered_at === null;
    }

    public function getSecondsUntilGuillotina(): ?int
    {
        if ($this->sla_deadline_at === null) {
            return null;
        }
        return max(0, now()->diffInSeconds($this->sla_deadline_at, false));
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeInbound(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('type', 'inbound');
    }

    public function scopeOutbound(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('type', 'outbound');
    }

    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->whereNotIn('status', self::TERMINAL_STATES);
    }

    public function scopeGuillotinaCandidates(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('sla_deadline_at', '<', now())
              ->whereNotIn('status', self::TERMINAL_STATES)
              ->whereNull('guillotina_triggered_at');
    }

    public function scopeApproachingGuillotina(\Illuminate\Database\Eloquent\Builder $query, int $withinHours = 4): void
    {
        $query->whereNotNull('sla_deadline_at')
              ->where('sla_deadline_at', '>', now())
              ->where('sla_deadline_at', '<=', now()->addHours($withinHours))
              ->whereNotIn('status', self::TERMINAL_STATES)
              ->whereNull('guillotina_triggered_at');
    }

    public function scopeVisibleTo(\Illuminate\Database\Eloquent\Builder $query, User $user): void
    {
        if ($user->isSuperAdmin()) {
            return;
        }

        if ($user->isEntityUser()) {
            $entityId = $user->entity_id ?? 0;
            $query->where(function ($q) use ($entityId) {
                $q->where('entity_id', $entityId)
                  ->orWhere('quota_holder_entity_id', $entityId);
            });
            return;
        }

        $query->where('tenant_id', $user->tenant_id);
    }
}
