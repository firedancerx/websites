<?php

namespace Tests\Feature;

use App\Models\DictionaryEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class DatabaseTranslationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Clear translation cache before each test
        Cache::flush();
    }

    public function test_it_resolves_translations_from_database_dictionary()
    {
        // 1. Create a dynamic dictionary entry
        DictionaryEntry::create([
            'group' => 'app',
            'key' => 'test_key',
            'ms' => 'Sila Cuba',
            'en' => 'Please Try',
        ]);

        // 2. Test Bahasa Melayu
        App::setLocale('ms');
        $this->assertEquals('Sila Cuba', __('app.test_key'));

        // 3. Test English
        App::setLocale('en');
        $this->assertEquals('Please Try', __('app.test_key'));
    }

    public function test_it_clears_cache_and_updates_translations_on_change()
    {
        $entry = DictionaryEntry::create([
            'group' => 'app',
            'key' => 'test_key',
            'ms' => 'Lama',
            'en' => 'Old',
        ]);

        App::setLocale('ms');
        $this->assertEquals('Lama', __('app.test_key'));

        // Update entry
        $entry->update([
            'ms' => 'Baru',
        ]);

        // Clear Laravel's Translator memory cache so it reads from Loader again
        $translator = app('translator');
        $reflector = new \ReflectionClass($translator);
        $property = $reflector->getProperty('loaded');
        $property->setAccessible(true);
        $property->setValue($translator, []);

        // Verify the cache was evicted and the translation is fresh
        $this->assertEquals('Baru', __('app.test_key'));
    }
}
