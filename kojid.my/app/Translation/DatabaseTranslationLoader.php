<?php

namespace App\Translation;

use Illuminate\Translation\FileLoader;
use App\Models\DictionaryEntry;
use Illuminate\Support\Facades\Cache;

class DatabaseTranslationLoader extends FileLoader
{
    /**
     * Load the messages for the given locale.
     *
     * @param  string  $locale
     * @param  string  $group
     * @param  string|null  $namespace
     * @return array
     */
    public function load($locale, $group, $namespace = null)
    {
        // For vendor namespaces, fall back to standard file loader
        if ($namespace && $namespace !== '*') {
            return parent::load($locale, $group, $namespace);
        }

        // Cache key for performance optimization
        $cacheKey = "translation.{$locale}.{$group}";

        return Cache::rememberForever($cacheKey, function () use ($locale, $group) {
            // Load file translations as baseline fallback
            $fileTranslations = parent::load($locale, $group, null);

            try {
                // Fetch dynamic DB translations
                $dbEntries = DictionaryEntry::where('group', $group)
                    ->whereNotNull($locale)
                    ->get(['key', $locale]);

                $dbTranslations = [];
                foreach ($dbEntries as $entry) {
                    // Reconstruct dot-notated array structure if keys use dots
                    $dbTranslations[$entry->key] = $entry->$locale;
                }

                // If DB translations use dot keys, expand them back to nested array format
                $expandedDbTranslations = [];
                foreach ($dbTranslations as $key => $value) {
                    data_set($expandedDbTranslations, $key, $value);
                }

                // Merge DB translations on top of file baseline
                return array_merge($fileTranslations, $expandedDbTranslations);
            } catch (\Exception $e) {
                // Return baseline file translations if DB is not ready or fails
                return $fileTranslations;
            }
        });
    }
}
