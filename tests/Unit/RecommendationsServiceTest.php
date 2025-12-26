<?php

namespace Tests\Unit;

use App\Enums\VideoStatus;
use App\Models\Favorite;
use App\Models\Video;
use App\Models\VideoViewHistory;
use App\Services\Videos\RecommendationsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecommendationsServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_recommendations_use_history_and_favorites(): void
    {
        $deviceHash = 'device-hash-reco';

        $historyVideo = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'romantic',
            'raw_tags' => ['soft'],
        ]);

        VideoViewHistory::create([
            'device_hash' => $deviceHash,
            'video_id' => $historyVideo->id,
            'last_watched_at' => now(),
        ]);

        $favoriteVideo = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'massage',
            'raw_tags' => ['relax'],
        ]);

        Favorite::create([
            'device_hash' => $deviceHash,
            'video_id' => $favoriteVideo->id,
        ]);

        $matchingCategory = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'romantic',
            'raw_tags' => ['evening'],
        ]);

        $matchingTag = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'playful',
            'raw_tags' => ['relax'],
        ]);

        $unrelated = Video::factory()->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'random',
            'raw_tags' => ['random'],
        ]);

        $service = app(RecommendationsService::class);
        $recommended = $service->recommended($deviceHash, 10, [$historyVideo->id], false);

        $this->assertTrue($recommended->contains('id', $matchingCategory->id));
        $this->assertTrue($recommended->contains('id', $matchingTag->id));
        $this->assertFalse($recommended->contains('id', $historyVideo->id));
        $this->assertFalse($recommended->contains('id', $unrelated->id));
    }
}
