<?php

namespace Tests\Unit;

use App\Services\Search\SearchQueryInterpreter;
use Tests\TestCase;

class SearchQueryInterpreterTest extends TestCase
{
    public function test_english_long_query_sets_duration_and_sort(): void
    {
        $service = app(SearchQueryInterpreter::class);
        $result = $service->interpret('long popular videos', 'en');

        $this->assertSame('long popular videos', $result['normalized']);
        $this->assertSame('long', $result['filters']['duration'] ?? null);
        $this->assertSame('views', $result['filters']['sort'] ?? null);
    }

    public function test_spanish_query_maps_intent_and_aliases(): void
    {
        $service = app(SearchQueryInterpreter::class);
        $result = $service->interpret('videos romanticos nuevos', 'es');

        $this->assertSame('romanticos', $result['tokens'][1] ?? null);
        $this->assertSame('week', $result['filters']['date'] ?? null);
        $this->assertContains('romantic', $result['tag_hints']);
    }

    public function test_stopwords_are_removed_from_query(): void
    {
        $service = app(SearchQueryInterpreter::class);
        $result = $service->interpret('the romantic couple', 'en');

        $this->assertStringNotContainsString('the', $result['query']);
        $this->assertStringContainsString('romantic', $result['query']);
    }
}
