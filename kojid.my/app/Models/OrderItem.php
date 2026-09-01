<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;

/**
 * App\Models\OrderItem
 *
 * Line item on an order. Stores product snapshot at time of order
 * to preserve historical accuracy even if product changes later.
 */
class OrderItem extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'order_id', 'product_id',
        'product_snapshot_name', 'product_snapshot_sku', 'product_snapshot_unit',
        'quantity', 'unit_price', 'line_total',
        'quota_fee_per_unit', 'logistics_cost',
        'shelf_life_days_snapshot', 'expiry_date', 'batch_number', 'notes',
    ];

    protected $casts = [
        'quantity'                => 'decimal:3',
        'unit_price'              => 'decimal:2',
        'line_total'              => 'decimal:2',
        'quota_fee_per_unit'      => 'decimal:2',
        'logistics_cost'          => 'decimal:2',
        'expiry_date'             => 'date',
        'shelf_life_days_snapshot' => 'integer',
    ];

    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Recalculate and update line_total from quantity * unit_price.
     */
    public function recalculateTotal(): void
    {
        $qty   = \Brick\Money\Money::of((string) $this->quantity, 'MYR');
        $price = \Brick\Money\Money::of((string) $this->unit_price, 'MYR');
        // Use bcmath for decimal multiplication
        $this->line_total = bcmul((string) $this->quantity, (string) $this->unit_price, 2);
        $this->saveQuietly();
    }
}
