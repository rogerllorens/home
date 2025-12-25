<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Services\Sitemaps\VideoSitemapGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class SitemapContentTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_contains_only_published_videos(): void
    {
        $published = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Published Video',
            'seo_description' => 'Published description',
            'embed_ok' => true,
        ]);
        $draft = Video::factory()->create([
            'status' => VideoStatus::Draft,
            'seo_title' => 'Draft Video',
            'seo_description' => 'Draft description',
            'embed_ok' => true,
        ]);

        $directory = public_path('sitemaps');
        File::ensureDirectoryExists($directory);

        $generator = app(VideoSitemapGenerator::class);
        $files = $generator->generate($directory, 100);

        $this->assertNotEmpty($files);
        $xml = File::get($directory.'/'.$files[0]);

        $publishedUrl = route('public.video', [
            'slug' => Str::slug($published->seo_title),
            'id' => $published->id,
        ]);
        $draftUrl = route('public.video', [
            'slug' => Str::slug($draft->seo_title),
            'id' => $draft->id,
        ]);

        $this->assertStringContainsString($publishedUrl, $xml);
        $this->assertStringNotContainsString($draftUrl, $xml);
    }
}
