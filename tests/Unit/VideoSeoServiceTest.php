<?php

namespace Tests\Unit;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Services\Videos\VideoAvailabilityPolicy;
use App\Services\Videos\VideoSeoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VideoSeoServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_canonical_slug_uses_seo_title_when_available(): void
    {
        $video = Video::factory()->create([
            'seo_title' => 'SEO Title',
            'title' => 'Fallback Title',
        ]);

        $slug = app(VideoSeoService::class)->canonicalSlug($video);

        $this->assertSame('seo-title', $slug);
    }

    public function test_robots_marks_unindexable_videos(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Quarantine,
            'seo_title' => 'SEO Title',
            'seo_description' => 'SEO Description',
            'embed_ok' => false,
        ]);

        $robots = app(VideoSeoService::class)->robots($video, app(VideoAvailabilityPolicy::class));

        $this->assertSame('noindex,follow', $robots);
    }
}
