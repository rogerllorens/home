<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SearchFallbackToSqlTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_falls_back_to_sql_when_meili_unhealthy(): void
    {
        config()->set('scout.driver', 'meilisearch');
        config()->set('scout.meilisearch.host', 'http://meili:7700');

        Http::fake([
            'http://meili:7700/health' => Http::response([], 500),
        ]);

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Fallback Title',
        ]);

        $response = $this->get(route('public.search', ['q' => 'Fallback']));

        $response->assertOk();
        $response->assertSee($video->title);
    }
}
