<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class VideoRobotsMetaTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_video_is_indexable(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'SEO title',
            'seo_description' => 'SEO description',
            'embed_ok' => true,
        ]);

        $slug = Str::slug($video->seo_title);

        $response = $this->get(route('public.video', ['slug' => $slug, 'id' => $video->id]));

        $response->assertOk();
        $response->assertSee('meta name="robots" content="index,follow"', false);
    }

    public function test_quarantined_video_is_noindex(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Quarantine,
            'seo_title' => 'SEO title',
            'seo_description' => 'SEO description',
            'embed_ok' => false,
        ]);

        $slug = Str::slug($video->seo_title);

        $response = $this->get(route('public.video', ['slug' => $slug, 'id' => $video->id]));

        $response->assertOk();
        $response->assertSee('meta name="robots" content="noindex,follow"', false);
    }
}
