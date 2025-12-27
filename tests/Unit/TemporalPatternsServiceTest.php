<?php

namespace Tests\Unit;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Models\VideoViewHistory;
use App\Services\TemporalPatternsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TemporalPatternsServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_detects_patterns_for_hour_and_day(): void
    {
        $deviceHash = 'device-time';
        $now = Carbon::create(2025, 3, 30, 21, 0, 0);

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'romantic',
            'raw_tags' => ['soft'],
        ]);

        VideoViewHistory::create([
            'device_hash' => $deviceHash,
            'video_id' => $video->id,
            'last_watched_at' => $now->copy()->subWeek(),
        ]);

        VideoViewHistory::create([
            'device_hash' => $deviceHash,
            'video_id' => $video->id,
            'last_watched_at' => $now->copy()->subWeeks(2),
        ]);

        $service = app(TemporalPatternsService::class);
        $result = $service->preferredForDevice($deviceHash, $now);

        $this->assertContains('romantic', $result['categories']);
        $this->assertContains('soft', $result['tags']);
    }
}
