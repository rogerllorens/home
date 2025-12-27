<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Models\VideoViewHistory;
use App\Support\DeviceHash;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class VideoDetailPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_video_detail_page_shows_metadata_ctas_and_related(): void
    {
        config()->set('candidboys.monetization.partner_links.cams.url', 'https://partner.example.com/cams');

        $deviceHash = 'device-hash-recommend';

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Hero title',
            'seo_description' => 'Hero description',
            'published_at' => now()->subDays(2),
            'embed_ok' => true,
            'category_slug' => 'featured',
        ]);

        $historyVideo = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'featured',
        ]);

        VideoViewHistory::create([
            'device_hash' => $deviceHash,
            'video_id' => $historyVideo->id,
            'last_watched_at' => now()->subDay(),
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'featured',
        ]);

        $related = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->withCookie(DeviceHash::cookieName(), $deviceHash)->get(route('public.video', [
            'locale' => 'en',
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee($video->title);
        $response->assertSee(trans('ui.video.featured_offers', [], 'en'));
        $response->assertSee(trans('ui.video.related', [], 'en'));
        $response->assertSee(trans('ui.video.recommended', [], 'en'));
        $response->assertSee(trans('ui.video.categories_tags', [], 'en'));
        $response->assertSee('data-like-button', false);
        $response->assertSee('data-favorite-button', false);
    }

    public function test_unavailable_video_shows_unavailable_notice(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Broken,
            'seo_title' => 'Broken title',
            'published_at' => now()->subDay(),
            'embed_ok' => false,
        ]);

        $response = $this->get(route('public.video', [
            'locale' => 'en',
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee(trans('ui.video.unavailable', [], 'en'));
    }

    public function test_video_page_displays_duration_views_and_tags(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Focus title',
            'published_at' => now()->subDay(),
            'duration_seconds' => 90,
            'raw_tags' => ['focus'],
        ]);

        $video->forceFill(['views_total' => 1200])->save();

        $response = $this->get(route('public.video', [
            'locale' => 'en',
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();
        $response->assertSee('01:30');
        $response->assertSee(trans('ui.video.views', ['count' => '1.2K'], 'en'));
        $response->assertSee('#focus');
    }
}
