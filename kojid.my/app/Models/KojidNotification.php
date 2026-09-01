<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;

/**
 * App\Models\KojidNotification
 *
 * In-app and email notifications.
 * Bilingual: title_ms/body_ms for Bahasa Melayu, title_en/body_en for English.
 * Display language resolved from user's locale preference.
 */
class KojidNotification extends Model
{
    // No updated_at on notification records
    const UPDATED_AT = null;

    use BelongsToTenant;

    protected $table = 'kojid_notifications';

    protected $fillable = [
        'tenant_id', 'user_id', 'type',
        'title_ms', 'title_en', 'body_ms', 'body_en',
        'order_id', 'deposit_id', 'action_url',
        'metadata', 'sent_via', 'read_at', 'emailed_at',
    ];

    protected $casts = [
        'read_at'    => 'datetime',
        'emailed_at' => 'datetime',
        'metadata'   => 'array',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    // -------------------------------------------------------------------------
    // Bilingual display helpers
    // -------------------------------------------------------------------------

    /**
     * Get the notification title in the user's locale.
     */
    public function getLocalizedTitle(?string $locale = null): string
    {
        $locale = $locale ?? app()->getLocale();
        return $locale === 'ms' ? $this->title_ms : $this->title_en;
    }

    /**
     * Get the notification body in the user's locale.
     */
    public function getLocalizedBody(?string $locale = null): string
    {
        $locale = $locale ?? app()->getLocale();
        return $locale === 'ms' ? $this->body_ms : $this->body_en;
    }

    public function isRead(): bool
    {
        return $this->read_at !== null;
    }

    public function markRead(): void
    {
        if (! $this->isRead()) {
            $this->update(['read_at' => now()]);
        }
    }

    public function scopeUnread(\Illuminate\Database\Eloquent\Builder $query): void
    {
        $query->whereNull('read_at');
    }

    public function scopeForUser(\Illuminate\Database\Eloquent\Builder $query, int $userId): void
    {
        $query->where('user_id', $userId);
    }
}
