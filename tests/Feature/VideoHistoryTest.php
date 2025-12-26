<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use App\Models\VideoViewHistory;
use App\Support\DeviceHash;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class VideoHistoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_video_visit_creates_history_entry(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
        ]);

        $deviceHash = 'device-hash-history';

        $response = $this->withCookie(DeviceHash::cookieName(), $deviceHash)
            ->get(route('public.video', [
                'slug' => Str::slug($video->seo_title ?: $video->title),
                'id' => $video->id,
            ]));

        $response->assertOk();
        $this->assertDatabaseHas('video_view_histories', [
            'device_hash' => $deviceHash,
            'video_id' => $video->id,
        ]);
    }

    public function test_history_page_shows_recent_videos(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
        ]);

        VideoViewHistory::create([
            'device_hash' => 'device-hash-history-page',
            'video_id' => $video->id,
            'last_watched_at' => now(),
        ]);

        $response = $this->withCookie(DeviceHash::cookieName(), 'device-hash-history-page')
            ->get(route('public.history'));

        $response->assertOk();
        $response->assertSee($video->title);
    }
}
