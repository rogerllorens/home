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

        $response = $this->get(route('public.search', ['q' => 'Unique Search']));

        $response->assertOk();
        $response->assertSee($video->title);
    }

    public function test_search_returns_empty_state(): void
    {
        $response = $this->get(route('public.search', ['q' => 'NoMatch']));

        $response->assertOk();
        $response->assertSee('No results found.');
    }
}
