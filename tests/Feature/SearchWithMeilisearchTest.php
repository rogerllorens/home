<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SearchWithMeilisearchTest extends TestCase
{
    public function test_search_uses_meilisearch_when_healthy(): void
    {
        if (!env('RUN_INTEGRATION_TESTS')) {
            $this->markTestSkipped('Integration test requires Meilisearch.');
        }

        config()->set('scout.driver', 'meilisearch');

        $host = rtrim((string) config('scout.meilisearch.host', ''), '/');
        if ($host === '') {
            $this->markTestSkipped('Meilisearch host not configured.');
        }

        Http::fake([
            "{$host}/health" => Http::response(['status' => 'available'], 200),
        ]);

        $response = $this->get(route('public.search', ['q' => 'test']));

        $response->assertOk();
    }
}
