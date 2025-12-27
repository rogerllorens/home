<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\SeoLanding;
use App\Models\TopicCluster;
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

    public function test_sitemap_includes_seo_landings_and_themes(): void
    {
        $directory = public_path('sitemaps');
        File::deleteDirectory($directory);

        SeoLanding::create([
            'slug' => 'sports-action-short',
            'type' => 'discover',
            'params' => [
                'category' => 'sports',
                'tag' => 'action',
                'duration' => 'short',
            ],
            'title_template' => 'Videos {duration} de {category} y {tag}',
            'description_template' => 'Descubre videos {duration} sobre {category}.',
            'language' => 'es',
        ]);

        TopicCluster::create([
            'name' => 'Sports Hub',
            'slug' => 'sports-hub',
            'category_slugs' => ['sports'],
            'tag_slugs' => ['action'],
            'language' => 'es',
        ]);

        Artisan::call('sitemaps:generate');

        $seoXml = File::get("{$directory}/seo-landings-1.xml");
        $themeXml = File::get("{$directory}/themes-1.xml");

        $this->assertStringContainsString('sports-action-short', $seoXml);
        $this->assertStringContainsString('sports-hub', $themeXml);
    }
}
