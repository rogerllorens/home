<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class SitemapGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_excludes_non_indexable_videos(): void
    {
        $directory = public_path('sitemaps');
        File::deleteDirectory($directory);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Indexable Video',
            'seo_description' => 'Desc',
            'embed_ok' => true,
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'No Embed',
            'seo_description' => 'Desc',
            'embed_ok' => false,
        ]);

        Artisan::call('sitemaps:generate');

        $xml = File::get("{$directory}/videos-1.xml");

        $this->assertStringContainsString('Indexable', $xml);
        $this->assertStringNotContainsString('No Embed', $xml);
    }
}
