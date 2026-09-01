<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use App\Traits\HasAuditTrail;

/**
 * App\Models\Settlement
 *
 * Financial settlement record for an order.
 * For 4-party orders, settlement_breakdowns contains all four disbursements.
 */
class Settlement extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, HasAuditTrail;

    protected $fillable = [
        'tenant_id', 'order_id', 'reference', 'type', 'status',
        'gross_sale_amount', 'goods_cost', 'quota_fee', 'logistics_cost',
        'gross_margin', 'margin_percent',
        'notes', 'adjustment_reason',
        'created_by', 'adjusted_by', 'adjusted_at', 'completed_at',
    ];

    protected $casts = [
        'gross_sale_amount' => 'decimal:2',
        'goods_cost'        => 'decimal:2',
        'quota_fee'         => 'decimal:2',
        'logistics_cost'    => 'decimal:2',
        'gross_margin'      => 'decimal:2',
        'margin_percent'    => 'decimal:2',
        'adjusted_at'       => 'datetime',
        'completed_at'      => 'datetime',
    ];

    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function breakdowns(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(SettlementBreakdown::class);
    }

    public function createdBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getGrossMarginMoney(): \Brick\Money\Money
    {
        return \Brick\Money\Money::of((string) $this->gross_margin, 'MYR');
    }
}

// ============================================================================

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

/**
 * App\Models\SettlementBreakdown
 *
 * Individual disbursement line in a 4-party settlement.
 * One row per party: buyer, real_supplier, virtual_supplier, logistics, tenant.
 */
class SettlementBreakdown extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'settlement_id', 'entity_id', 'party_role',
        'description', 'amount', 'direction', 'status',
        'payment_reference', 'paid_at',
    ];

    protected $casts = [
        'amount'   => 'decimal:2',
        'paid_at'  => 'datetime',
    ];

    public function settlement(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Settlement::class);
    }

    public function entity(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    public function getAmountMoney(): \Brick\Money\Money
    {
        return \Brick\Money\Money::of((string) $this->amount, 'MYR');
    }
}
