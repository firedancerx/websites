<?php

namespace App\Traits;

use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * HasAuditTrail
 *
 * Wraps spatie/laravel-activitylog with KOJID-specific defaults.
 * Enforces 7-year LHDN retention policy (enforced at infrastructure level).
 * All financial and business record changes are logged immutably.
 */
trait HasAuditTrail
{
    use LogsActivity;

    /**
     * Configure activity log options for the model.
     * Logs all dirty (changed) attributes by default.
     */
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll()                          // Log every attribute change
            ->logOnlyDirty()                    // Only log what actually changed
            ->dontSubmitEmptyLogs()             // Skip no-op saves
            ->useLogName($this->getAuditLogName())
            ->setDescriptionForEvent(fn (string $eventName) => $this->getAuditDescription($eventName));
    }

    /**
     * Log name — allows filtering by model type in audit search.
     */
    protected function getAuditLogName(): string
    {
        return class_basename($this);
    }

    /**
     * Human-readable description for audit entries.
     */
    protected function getAuditDescription(string $eventName): string
    {
        return sprintf(
            '%s %s #%s',
            ucfirst($eventName),
            class_basename($this),
            $this->getKey() ?? 'new'
        );
    }
}
