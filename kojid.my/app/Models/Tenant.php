<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasAuditTrail;

/**
 * App\Models\Tenant
 *
 * Represents an independent intermediary business on the KOJID platform.
 * Each tenant is data-isolated via row-level tenancy (tenant_id).
 *
 * @property int         $id
 * @property string      $name
 * @property string      $slug
 * @property bool        $is_active
 * @property array|null  $settings
 * @property string|null $domain
 */
class Tenant extends Model
{
    use HasFactory, SoftDeletes, HasAuditTrail;

    protected $fillable = [
        'parent_id', 'name', 'slug', 'is_active', 'settings', 'domain',
        'logo_path', 'contact_email', 'contact_phone',
        'address_line1', 'address_line2', 'address_line3', 'postcode', 'town', 'state', 'country',
        'ssm_number', 'subscription_expires_at', 'tenant_types', 'status',
    ];

    protected $casts = [
        'parent_id'               => 'integer',
        'is_active'               => 'boolean',
        'settings'                => 'array',
        'subscription_expires_at' => 'date',
        'tenant_types'            => 'array',
    ];

    protected static function booted()
    {
        static::updating(function ($tenant) {
            if ($tenant->isDirty('parent_id')) {
                // Restore original parent_id to enforce immutability
                $tenant->parent_id = $tenant->getOriginal('parent_id');
            }
        });
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function parent(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'parent_id');
    }

    public function children(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Tenant::class, 'parent_id');
    }

    public function users(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class);
    }

    public function entities(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Entity::class);
    }

    public function orders(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class);
    }

    // -------------------------------------------------------------------------
    // Settings Helpers
    // -------------------------------------------------------------------------

    /**
     * Get a tenant-specific setting with fallback to platform default.
     *
     * @param string $key     Dot-notation key within settings JSON
     * @param mixed  $default Fallback value
     */
    public function getSetting(string $key, mixed $default = null): mixed
    {
        return data_get($this->settings, $key, $default);
    }

    /**
     * Get a tenant-specific setting resolving up the hierarchy tree.
     */
    public function getTenantSetting(string $key, mixed $default = null): mixed
    {
        // 1. Check local settings first
        $value = $this->getSetting($key);
        if ($value !== null) {
            return $value;
        }

        // 2. If subtenant, resolve parent settings
        if ($this->parent_id) {
            $parent = $this->parent;
            if ($parent) {
                $parentValue = $parent->getTenantSetting($key);
                if ($parentValue !== null) {
                    return $parentValue;
                }
            }
        }

        // 3. Fall back to Master Tenant settings
        static $masterSettings = null;
        if ($masterSettings === null) {
            $master = self::whereNull('parent_id')->first();
            $masterSettings = $master ? $master->settings : [];
        }
        $masterValue = data_get($masterSettings, $key);
        if ($masterValue !== null) {
            return $masterValue;
        }

        // 4. Local application default config
        return config("kojid.defaults.{$key}", $default);
    }

    /**
     * Get UI Theme Template variable name.
     */
    public function getUiTemplate(): string
    {
        return $this->getTenantSetting('branding.ui_template', 'slate');
    }

    /**
     * Get company branding logo.
     */
    public function getBrandingLogo(): ?string
    {
        if ($this->logo_path) {
            return $this->logo_path;
        }
        if ($this->parent_id && $this->parent) {
            return $this->parent->getBrandingLogo();
        }
        return $this->getTenantSetting('branding.logo_path');
    }

    /**
     * Get the deposit rate for this tenant (from settings or platform default).
     */
    public function getDefaultDepositRate(): float
    {
        return (float) $this->getTenantSetting(
            'deposits.default_deposit_rate',
            config('kojid.deposits.default_rate', 30.00)
        );
    }

    /**
     * Get SLA hours for a given order type and state.
     */
    public function getSlaHours(string $orderType, string $state): int
    {
        $tenantSla = $this->getSetting("sla_timers.{$orderType}.{$state}");

        return (int) ($tenantSla ?? config("kojid.sla.{$orderType}.{$state}", 24));
    }

    /**
     * Check if this tenant has a specific type.
     */
    public function hasTenantType(string $type): bool
    {
        return is_array($this->tenant_types) && in_array($type, $this->tenant_types);
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('is_active', true);
    }
}
