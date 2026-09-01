<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use App\Traits\HasAuditTrail;

/**
 * App\Models\User
 *
 * Represents a person (employee or external user) on the platform.
 * Distinct from Entity (legal trading counterparty).
 *
 * @property int         $id
 * @property int|null    $tenant_id   NULL = super admin
 * @property int|null    $entity_id   Set for supplier/buyer/quota holder portal users
 * @property string      $name
 * @property string      $email
 * @property string      $locale      'ms' or 'en'
 * @property bool        $is_active
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable, SoftDeletes, HasRoles, HasAuditTrail;

    protected $fillable = [
        'tenant_id', 'entity_id', 'name', 'email', 'ic_number', 'password',
        'locale', 'is_active', 'phone',
        'last_login_at', 'last_login_ip',
        'failed_login_attempts', 'locked_until',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at'      => 'datetime',
        'last_login_at'          => 'datetime',
        'locked_until'           => 'datetime',
        'is_active'              => 'boolean',
        'failed_login_attempts'  => 'integer',
        'password'               => 'hashed',
    ];

    protected static function booted()
    {
        static::saving(function ($user) {
            if ($user->is_active) {
                $alreadyActive = self::where('email', $user->email)
                    ->where('is_active', true)
                    ->where('id', '!=', $user->id)
                    ->exists();
                if ($alreadyActive) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'email' => ['User is already active under another tenant.'],
                    ]);
                }
            }
        });
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    public function tenant(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function entity(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Entity::class);
    }

    public function notifications(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(KojidNotification::class, 'user_id');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Whether this user is a platform-level super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->tenant_id === null && $this->hasRole('super_admin');
    }

    /**
     * Whether this user represents a supplier, buyer, or quota holder entity.
     */
    public function isEntityUser(): bool
    {
        return $this->entity_id !== null
            || $this->hasAnyRole(['external_supplier', 'external_buyer', 'external_quota_holder']);
    }

    /**
     * Whether this user manages tenant-level data rather than a single entity.
     */
    public function isTenantUser(): bool
    {
        return ! $this->isSuperAdmin() && ! $this->isEntityUser() && $this->tenant_id !== null;
    }

    /**
     * Whether the user's account is currently locked out.
     */
    public function isLocked(): bool
    {
        return $this->locked_until !== null && $this->locked_until->isFuture();
    }

    /**
     * Record a successful login.
     */
    public function recordLogin(string $ip): void
    {
        $this->update([
            'last_login_at'         => now(),
            'last_login_ip'         => $ip,
            'failed_login_attempts' => 0,
            'locked_until'          => null,
        ]);
    }

    /**
     * Increment failed login counter; lock after 5 attempts.
     */
    public function recordFailedLogin(): void
    {
        $attempts = $this->failed_login_attempts + 1;
        $data     = ['failed_login_attempts' => $attempts];

        if ($attempts >= 5) {
            $data['locked_until'] = now()->addMinutes(30);
        }

        $this->update($data);
    }

    /**
     * Get the user's unread notification count for badge display.
     */
    public function unreadNotificationCount(): int
    {
        return $this->notifications()->whereNull('read_at')->count();
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->where('is_active', true);
    }

    public function scopeForTenant(\Illuminate\Database\Eloquent\Builder $query, int $tenantId): void
    {
        $query->where('tenant_id', $tenantId);
    }
}
