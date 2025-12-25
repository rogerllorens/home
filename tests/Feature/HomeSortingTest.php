<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HomeSortingTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_sorts_by_most_recent(): void
    {
        $older = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDays(3),
        ]);
        $newer = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDay(),
        ]);

        $response = $this->get(route('public.home', ['sort' => 'recent']));
        $response->assertOk();

        $paginator = $response->viewData('latestVideos');
        $items = $paginator->items();

        $this->assertSame($newer->id, $items[0]->id);
        $this->assertSame($older->id, $items[1]->id);
    }

    public function test_home_sorts_by_longest_duration(): void
    {
        $short = Video::factory()->create([
            'status' => VideoStatus::Published,
            'duration_seconds' => 60,
            'published_at' => now()->subDays(2),
        ]);
        $long = Video::factory()->create([
            'status' => VideoStatus::Published,
            'duration_seconds' => 600,
            'published_at' => now()->subDays(3),
        ]);

        $response = $this->get(route('public.home', ['sort' => 'longest']));
        $response->assertOk();

        $paginator = $response->viewData('latestVideos');
        $items = $paginator->items();

        $this->assertSame($long->id, $items[0]->id);
        $this->assertSame($short->id, $items[1]->id);
    }
}
