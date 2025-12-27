<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_returns_results(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Unique Search Title',
        ]);

        $response = $this->get(route('public.search', ['locale' => 'en', 'q' => 'Unique Search']));

        $response->assertOk();
        $response->assertSee($video->title);
    }

    public function test_search_returns_empty_state(): void
    {
        $response = $this->get(route('public.search', ['locale' => 'en', 'q' => 'NoMatch']));

        $response->assertOk();
        $response->assertSee(trans('ui.search.no_results', [], 'en'));
    }

    public function test_search_filters_by_duration(): void
    {
        $short = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Filter Short',
            'duration_seconds' => 120,
        ]);

        $long = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Filter Long',
            'duration_seconds' => 1200,
        ]);

        $response = $this->get(route('public.search', [
            'locale' => 'en',
            'q' => 'Filter',
            'duration' => 'short',
        ]));

        $response->assertOk();
        $response->assertSee($short->title);
        $response->assertDontSee($long->title);
    }
}
