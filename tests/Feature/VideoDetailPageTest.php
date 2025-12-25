<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class VideoDetailPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_video_detail_page_shows_metadata_ctas_and_related(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/cams');

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Hero title',
            'seo_description' => 'Hero description',
            'published_at' => now()->subDays(2),
            'embed_ok' => true,
        ]);

        $related = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee($video->title);
        $response->assertSee('Featured offers');
        $response->assertSee('Related videos');
        $response->assertSee($related->title);
    }
}
