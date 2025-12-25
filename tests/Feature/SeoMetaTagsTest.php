<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SeoMetaTagsTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_has_title_and_description(): void
    {
        $response = $this->get(route('public.home'));

        $response->assertOk();
        $response->assertSee('<title>', false);
        $response->assertSee('meta name="description"', false);
        $response->assertSee('rel="canonical"', false);
    }

    public function test_video_page_has_robots_and_canonical(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'SEO title',
            'seo_description' => 'SEO description',
            'embed_ok' => true,
        ]);

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee('meta name="robots" content="index,follow"', false);
        $response->assertSee('rel="canonical"', false);
    }
}
