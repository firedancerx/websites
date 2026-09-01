<?php

namespace Database\Seeders;

use App\Models\DictionaryEntry;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class DictionarySeeder extends Seeder
{
    public function run(): void
    {
        $groups = ['app', 'auth', 'dashboard', 'entities', 'ledger', 'nav', 'notifications', 'orders', 'payments', 'reports', 'tenants'];

        foreach ($groups as $group) {
            $msPath = base_path("lang/ms/{$group}.php");
            $enPath = base_path("lang/en/{$group}.php");

            $msData = file_exists($msPath) ? include($msPath) : [];
            $enData = file_exists($enPath) ? include($enPath) : [];

            // Flatten arrays using dot notation
            $msFlat = Arr::dot($msData);
            $enFlat = Arr::dot($enData);

            // Get all unique keys
            $allKeys = array_unique(array_merge(array_keys($msFlat), array_keys($enFlat)));

            foreach ($allKeys as $key) {
                $msValue = $msFlat[$key] ?? null;
                $enValue = $enFlat[$key] ?? null;

                DictionaryEntry::updateOrCreate(
                    ['group' => $group, 'key' => $key],
                    ['ms' => $msValue, 'en' => $enValue]
                );
            }
        }

        $this->command->info('✓ Seeded database-driven dictionary.');
    }
}
