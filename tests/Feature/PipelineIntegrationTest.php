<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PipelineIntegrationTest extends TestCase
{
    public function test_meilisearch_and_ollama_health_checks(): void
    {
        if (!env('RUN_INTEGRATION_TESTS')) {
            $this->markTestSkipped('Integration tests require external services.');
        }

        $meiliHost = rtrim((string) config('scout.meilisearch.host', ''), '/');
        if ($meiliHost !== '') {
            $response = Http::timeout(2)->get("{$meiliHost}/health");
            $response->throw();
            $this->assertTrue($response->successful());
        }

        $ollamaHost = rtrim((string) config('candidboys.ai.ollama_host', ''), '/');
        if ($ollamaHost !== '') {
            $response = Http::timeout(2)->get("{$ollamaHost}/api/tags");
            $response->throw();
            $this->assertTrue($response->successful());
        }
    }
}
