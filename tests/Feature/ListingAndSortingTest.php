<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ListingAndSortingTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_sorts_by_most_viewed(): void
    {
        \Illuminate\Support\Facades\Cache::flush();

        $lessViewed = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDays(2),
        ]);
        $moreViewed = Video::factory()->create([
            'status' => VideoStatus::Published,
            'published_at' => now()->subDays(3),
        ]);

        \App\Models\VideoViewDaily::create([
            'video_id' => $lessViewed->id,
            'day' => now()->toDateString(),
            'views' => 10,
        ]);
        \App\Models\VideoViewDaily::create([
            'video_id' => $moreViewed->id,
            'day' => now()->toDateString(),
            'views' => 150,
        ]);

        $response = $this->get(route('public.home', ['sort' => 'views']));
        $response->assertOk();

        $paginator = $response->viewData('latestVideos');
        $items = $paginator->items();

        $this->assertSame($moreViewed->id, $items[0]->id);
        $this->assertSame($lessViewed->id, $items[1]->id);
    }

    public function test_category_pagination_works(): void
    {
        \Illuminate\Support\Facades\Cache::flush();

        Video::factory()->count(30)->create([
            'status' => VideoStatus::Published,
            'category_slug' => 'romantic',
        ]);

        $response = $this->get(route('public.category', 'romantic'));
        $response->assertOk();

        $paginator = $response->viewData('videos');
        $this->assertSame(24, $paginator->perPage());
        $this->assertSame(2, $paginator->lastPage());
    }
}
