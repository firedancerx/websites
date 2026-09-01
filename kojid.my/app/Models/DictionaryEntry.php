<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class DictionaryEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'group',
        'key',
        'ms',
        'en',
    ];

    protected static function booted()
    {
        // Clear cached translation maps when saved or deleted
        static::saved(function ($entry) {
            Cache::forget("translation.ms.{$entry->group}");
            Cache::forget("translation.en.{$entry->group}");
        });

        static::deleted(function ($entry) {
            Cache::forget("translation.ms.{$entry->group}");
            Cache::forget("translation.en.{$entry->group}");
        });
    }
}
