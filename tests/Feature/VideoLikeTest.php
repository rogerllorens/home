<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VideoLikeTest extends TestCase
{
    use RefreshDatabase;

    public function test_like_endpoint_toggles_like_state(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
        ]);

        $cookie = ['device_id' => 'test-device'];

        $response = $this->withCookies($cookie)->post(route('public.video.like', $video));
        $response->assertOk();
        $response->assertJson([
            'liked' => true,
            'likes_count' => 1,
        ]);

        $response = $this->withCookies($cookie)->post(route('public.video.like', $video));
        $response->assertOk();
        $response->assertJson([
            'liked' => false,
            'likes_count' => 0,
        ]);
    }
}
