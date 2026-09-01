<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use App\Traits\HasAuditTrail;

/**
 * App\Models\AggregationBatch
 *
 * Groups multiple orders into a logistics batch.
 * Inbound batch: multiple MSK- orders from different suppliers in one receiving run.
 * Outbound batch: multiple KLR- orders to different buyers in one delivery run.
 * Frozen/ambient mixing requires explicit allows_mixed_temperature flag.
 */
class AggregationBatch extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, HasAuditTrail;

    protected $fillable = [
        'tenant_id', 'type', 'status',
        'scheduled_at', 'notes',
        'allows_mixed_temperature', 'created_by',
    ];

    protected $casts = [
        'scheduled_at'             => 'datetime',
        'allows_mixed_temperature' => 'boolean',
    ];

    public function orders(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Order::class, 'order_aggregation_batch')
                    ->withPivot(['added_at', 'added_by'])
                    ->withTimestamps();
    }

    public function createdBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeInbound(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('type', 'inbound');
    }

    public function scopeOutbound(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('type', 'outbound');
    }

    public function isActive(): bool
    {
        return in_array($this->status, ['forming', 'confirmed', 'in_transit'], true);
    }
}
