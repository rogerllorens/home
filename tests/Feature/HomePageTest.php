<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_renders_featured_and_latest_videos(): void
    {
        \Illuminate\Support\Facades\Cache::flush();

        $featured = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDay(),
        ]);

        $latest = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now(),
        ]);

        $response = $this->get(route('public.home'));

        $response->assertOk();
        $response->assertSee($featured->title);
        $response->assertSee($latest->title);
    }

    public function test_home_page_empty_state(): void
    {
        \Illuminate\Support\Facades\Cache::flush();

        $response = $this->get(route('public.home'));

        $response->assertOk();
        $response->assertSee('No videos available right now.');
    }
}
