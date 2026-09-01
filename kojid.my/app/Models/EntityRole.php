<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;
use App\Traits\HasAuditTrail;

/**
 * App\Models\EntityRole
 *
 * Quantum Actor role assignment. One entity can hold multiple roles.
 * Changes are logged immutably via HasAuditTrail.
 */
class EntityRole extends Model
{
    use BelongsToTenant, HasAuditTrail;

    protected $fillable = [
        'entity_id', 'tenant_id', 'role', 'is_primary',
        'activated_by_transaction_type', 'notes', 'created_by',
        'revoked_at', 'revoked_by',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'revoked_at' => 'datetime',
    ];

    public function entity(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    public function createdBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function revokedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }

    public function isActive(): bool
    {
        return $this->revoked_at === null;
    }

    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->whereNull('revoked_at');
    }
}
