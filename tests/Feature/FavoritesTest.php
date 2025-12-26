<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Favorite;
use App\Models\Video;
use App\Support\DeviceHash;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FavoritesTest extends TestCase
{
    use RefreshDatabase;

    public function test_device_can_add_and_remove_favorites(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
        ]);

        $deviceHash = 'device-hash-123';

        $response = $this->withCookie(DeviceHash::cookieName(), $deviceHash)
            ->postJson(route('public.favorites.store', $video));

        $response->assertOk();
        $response->assertJson(['favorited' => true]);
        $this->assertDatabaseHas('favorites', [
            'device_hash' => $deviceHash,
            'video_id' => $video->id,
        ]);

        $deleteResponse = $this->withCookie(DeviceHash::cookieName(), $deviceHash)
            ->deleteJson(route('public.favorites.destroy', $video));

        $deleteResponse->assertOk();
        $deleteResponse->assertJson(['favorited' => false]);
        $this->assertDatabaseMissing('favorites', [
            'device_hash' => $deviceHash,
            'video_id' => $video->id,
        ]);
    }

    public function test_favorites_page_shows_device_videos(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
        ]);

        $deviceHash = 'device-hash-789';

        Favorite::create([
            'device_hash' => $deviceHash,
            'video_id' => $video->id,
        ]);

        $response = $this->withCookie(DeviceHash::cookieName(), $deviceHash)
            ->get(route('public.favorites'));

        $response->assertOk();
        $response->assertSee($video->title);
    }
}
