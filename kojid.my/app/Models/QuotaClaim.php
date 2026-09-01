<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Traits\BelongsToTenant;
use App\Traits\HasAuditTrail;

class QuotaClaim extends Model
{
    use BelongsToTenant, HasAuditTrail;

    protected $fillable = [
        'tenant_id', 'commodity_type', 'claimed_qty', 'status',
        'evidence_path', 'reviewer_notes', 'verified_by', 'verified_at'
    ];

    protected $casts = [
        'claimed_qty' => 'decimal:2',
        'verified_at' => 'datetime',
    ];

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
