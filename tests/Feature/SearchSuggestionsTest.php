<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchSuggestionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_suggestions_endpoint_returns_tags_categories_and_videos(): void
    {
        Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Couple Highlights',
            'raw_tags' => ['couples'],
        ]);

        $response = $this->get(route('public.search.suggestions', ['q' => 'co']));

        $response->assertOk();
        $response->assertJsonFragment(['label' => 'couples']);
        $response->assertJsonFragment(['label' => 'Couples']);
        $response->assertJsonFragment(['title' => 'Couple Highlights']);
    }
}
