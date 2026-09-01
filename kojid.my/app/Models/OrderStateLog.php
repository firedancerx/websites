<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

/**
 * App\Models\OrderStateLog
 *
 * Immutable record of every order state transition.
 * NEVER update or delete records in this table — append only.
 * The saving hook enforces immutability at the model level (DB trigger also enforced).
 */
class OrderStateLog extends Model
{
    // No updated_at on this table
    const UPDATED_AT = null;

    protected $fillable = [
        'tenant_id', 'order_id', 'from_state', 'to_state',
        'triggered_by_type', 'triggered_by_user_id', 'triggered_by_label',
        'notes', 'metadata', 'triggered_at',
    ];

    protected $casts = [
        'triggered_at' => 'datetime',
        'metadata'     => 'array',
    ];

    use BelongsToTenant;

    /**
     * Boot — prevent any updates to existing records.
     */
    protected static function booted(): void
    {
        static::updating(function () {
            throw new \RuntimeException('OrderStateLog records are immutable. Cannot update.');
        });

        static::deleting(function () {
            throw new \RuntimeException('OrderStateLog records cannot be deleted.');
        });
    }

    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function triggeredByUser(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'triggered_by_user_id');
    }

    /**
     * Human-readable transition description.
     */
    public function getTransitionLabel(): string
    {
        $from = $this->from_state ?? 'START';
        return "{$from} → {$this->to_state}";
    }
}
