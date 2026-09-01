<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;

class TenantLogoSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();
        $this->command->info("Found " . $tenants->count() . " tenants. Setting up abstract logos...");

        // Ensure directory exists
        Storage::disk('public')->makeDirectory('logos');

        foreach ($tenants as $tenant) {
            $slug = $tenant->slug;
            $fileName = "logos/{$slug}.svg";
            
            // Try downloading from Dicebear first (shapes style is purely geometric/abstract)
            $url = "https://api.dicebear.com/7.x/shapes/svg?seed=" . urlencode($slug);
            $success = false;

            try {
                $response = Http::timeout(3)->get($url);
                if ($response->successful() && !empty($response->body())) {
                    Storage::disk('public')->put($fileName, $response->body());
                    $success = true;
                }
            } catch (\Exception $e) {
                // Ignore and fall back to local generation
            }

            if (!$success) {
                // Generate a local high-quality abstract SVG logo
                $svgContent = $this->generateFallbackSvg($slug);
                Storage::disk('public')->put($fileName, $svgContent);
            }

            $tenant->update(['logo_path' => $fileName]);
            $this->command->info("✓ Assigned abstract logo to: {$tenant->name}");
        }
    }

    /**
     * Generate a premium, clean abstract geometric pattern SVG logo.
     */
    private function generateFallbackSvg(string $seed): string
    {
        $hash = md5($seed);
        $color1 = '#' . substr($hash, 0, 6);
        $color2 = '#' . substr($hash, 6, 6);
        $color3 = '#' . substr($hash, 12, 6);
        
        $type = hexdec(substr($hash, 18, 2)) % 4;
        
        $shapes = '';
        if ($type === 0) {
            // Concentric circles
            $shapes = "
                <circle cx='50' cy='50' r='38' fill='{$color1}' />
                <circle cx='50' cy='50' r='24' fill='{$color2}' />
                <circle cx='50' cy='50' r='10' fill='{$color3}' />
            ";
        } elseif ($type === 1) {
            // Overlapping squares/diamonds
            $shapes = "
                <rect x='18' y='18' width='64' height='64' fill='{$color1}' rx='12' transform='rotate(45 50 50)' />
                <rect x='28' y='28' width='44' height='44' fill='{$color2}' rx='8' />
                <circle cx='50' cy='50' r='10' fill='{$color3}' />
            ";
        } elseif ($type === 2) {
            // Hexagon/Polygon pattern
            $shapes = "
                <polygon points='50,12 88,32 88,68 50,88 12,68 12,32' fill='{$color1}' />
                <polygon points='50,24 78,38 78,62 50,76 22,62 22,38' fill='{$color2}' />
                <circle cx='50' cy='50' r='12' fill='{$color3}' />
            ";
        } else {
            // Cross/Rotated flower pattern
            $shapes = "
                <rect x='36' y='12' width='28' height='76' fill='{$color1}' rx='14' />
                <rect x='12' y='36' width='76' height='28' fill='{$color1}' rx='14' />
                <circle cx='50' cy='50' r='18' fill='{$color2}' />
                <rect x='44' y='44' width='12' height='12' fill='{$color3}' rx='3' transform='rotate(45 50 50)' />
            ";
        }
        
        return "<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'>
    <rect width='100' height='100' fill='#f8fafc' rx='24' />
    {$shapes}
</svg>";
    }
}
