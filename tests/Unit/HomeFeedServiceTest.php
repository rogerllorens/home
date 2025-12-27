<?php

namespace Tests\Unit;

use App\Enums\HomeIntent;
use App\Enums\VideoStatus;
use App\Models\Video;
use App\Models\VideoViewHistory;
use App\Services\Personalization\HomeFeedService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeFeedServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_quick_intent_prioritizes_short_content(): void
    {
        $deviceHash = 'device-quick';

        $shortVideo = Video::factory()->create([
            'status' => VideoStatus::Published,
            'duration_seconds' => 120,
            'published_at' => now()->subDay(),
        ]);

        Video::factory()->create([
            'status' => VideoStatus::Published,
            'duration_seconds' => 900,
            'published_at' => now()->subDay(),
        ]);

        VideoViewHistory::create([
            'device_hash' => $deviceHash,
            'video_id' => $shortVideo->id,
            'last_watched_at' => now()->subHour(),
        ]);

        $service = app(HomeFeedService::class);
        $result = $service->build($deviceHash, HomeIntent::Quick);

        $sections = collect($result['sections']);
        $quickSection = $sections->firstWhere('id', 'quick_picks');

        $this->assertNotNull($quickSection);
        foreach ($quickSection['videos'] as $video) {
            $this->assertTrue($video->duration_seconds <= 300);
        }
    }

    public function test_explore_intent_avoids_recent_history(): void
    {
        $deviceHash = 'device-explore';

        $watched = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDays(2),
        ]);

        $fresh = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDay(),
        ]);

        VideoViewHistory::create([
            'device_hash' => $deviceHash,
            'video_id' => $watched->id,
            'last_watched_at' => now()->subHour(),
        ]);

        $service = app(HomeFeedService::class);
        $result = $service->build($deviceHash, HomeIntent::Explore);

        $sections = collect($result['sections']);
        $discoveries = $sections->firstWhere('id', 'fresh_discoveries');

        $this->assertNotNull($discoveries);
        $videoIds = collect($discoveries['videos'])->pluck('id')->all();
        $this->assertContains($fresh->id, $videoIds);
        $this->assertNotContains($watched->id, $videoIds);
    }
}
