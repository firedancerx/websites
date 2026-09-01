<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\BelongsToTenant;
use App\Traits\HasAuditTrail;

/**
 * App\Models\ProductCategory
 *
 * Product category with logistics constraints (frozen/ambient segregation)
 * and quota regulation flags (beras, gula under KPDNHEP/BERNAS).
 */
class ProductCategory extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant, HasAuditTrail;

    protected $fillable = [
        'tenant_id', 'name', 'name_ms', 'code',
        'description', 'is_quota_regulated', 'is_perishable',
        'is_frozen', 'default_shelf_life_days', 'is_active',
    ];

    protected $casts = [
        'is_quota_regulated'     => 'boolean',
        'is_perishable'          => 'boolean',
        'is_frozen'              => 'boolean',
        'is_active'              => 'boolean',
        'default_shelf_life_days' => 'integer',
    ];

    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('is_active', true);
    }

    public function getLocalizedName(): string
    {
        $locale = app()->getLocale();
        return ($locale === 'ms' && $this->name_ms) ? $this->name_ms : $this->name;
    }
}
