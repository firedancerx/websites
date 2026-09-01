<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use App\Traits\HasAuditTrail;

/**
 * App\Models\Product
 *
 * Tenant product catalog. SKU is unique per tenant.
 * Tracks shelf life for DoF (Degree of Freshness) monitoring.
 * Quota-regulated products trigger 4-party settlement.
 */
class Product extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, HasAuditTrail;

    protected $fillable = [
        'tenant_id', 'category_id', 'name', 'name_ms', 'sku',
        'unit', 'unit_weight_kg', 'shelf_life_days',
        'is_quota_regulated', 'quota_authority',
        'cost_price', 'selling_price', 'description', 'is_active',
    ];

    protected $casts = [
        'is_quota_regulated' => 'boolean',
        'is_active'          => 'boolean',
        'shelf_life_days'    => 'integer',
        'unit_weight_kg'     => 'decimal:3',
        'cost_price'         => 'decimal:2',
        'selling_price'      => 'decimal:2',
    ];

    public function category(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id');
    }

    public function orderItems(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Effective shelf life: product override → category default.
     */
    public function getEffectiveShelfLifeDays(): ?int
    {
        return $this->shelf_life_days ?? $this->category?->default_shelf_life_days;
    }

    /**
     * Whether this product requires quota-holder involvement (4-party settlement).
     */
    public function requiresQuota(): bool
    {
        return $this->is_quota_regulated || ($this->category?->is_quota_regulated ?? false);
    }

    public function getLocalizedName(): string
    {
        $locale = app()->getLocale();
        return ($locale === 'ms' && $this->name_ms) ? $this->name_ms : $this->name;
    }

    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('is_active', true);
    }
}
