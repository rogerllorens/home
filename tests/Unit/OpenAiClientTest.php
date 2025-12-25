<?php

namespace Tests\Unit;

use App\Services\AI\OpenAiClient;
use App\Services\CategorySlugNormalizer;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Psr\Log\NullLogger;
use Tests\TestCase;

class OpenAiClientTest extends TestCase
{
    public function test_invalid_json_throws_exception(): void
    {
        $handler = new MockHandler([
            new Response(200, [], json_encode([
                'choices' => [
                    ['message' => ['content' => 'NOT JSON']],
                ],
            ])),
        ]);

        $client = new Client(['handler' => HandlerStack::create($handler)]);
        $service = new OpenAiClient($client, new NullLogger(), app(CategorySlugNormalizer::class));

        $this->expectException(\RuntimeException::class);

        $service->generateVideoSeo([
            'raw_title' => 'title',
            'raw_description' => 'desc',
            'raw_tags' => 'tag1,tag2,tag3',
            'duration_seconds' => 120,
            'source_name' => 'source',
        ]);
    }

    public function test_title_too_long_is_rejected(): void
    {
        $payload = json_encode([
            'choices' => [
                ['message' => ['content' => json_encode([
                    'seo_title' => str_repeat('A', 200),
                    'seo_description' => str_repeat('B', 160),
                    'seo_tags' => array_fill(0, 8, 'tag'),
                    'category_slug' => 'real-amateur',
                    'quality_score' => 90,
                ])]],
            ],
        ]);

        $handler = new MockHandler([new Response(200, [], $payload)]);
        $client = new Client(['handler' => HandlerStack::create($handler)]);
        $service = new OpenAiClient($client, new NullLogger(), app(CategorySlugNormalizer::class));

        $this->expectException(\RuntimeException::class);

        $service->generateVideoSeo([
            'raw_title' => 'title',
            'raw_description' => 'desc',
            'raw_tags' => 'tag1,tag2,tag3',
            'duration_seconds' => 120,
            'source_name' => 'source',
        ]);
    }

    public function test_invalid_category_maps_to_default(): void
    {
        $payload = json_encode([
            'choices' => [
                ['message' => ['content' => json_encode([
                    'seo_title' => str_repeat('A', 50),
                    'seo_description' => str_repeat('B', 160),
                    'seo_tags' => array_map(fn ($i) => 'tag'.$i, range(1, 8)),
                    'category_slug' => 'not-allowed',
                    'quality_score' => 90,
                ])]],
            ],
        ]);

        $handler = new MockHandler([new Response(200, [], $payload)]);
        $client = new Client(['handler' => HandlerStack::create($handler)]);
        $service = new OpenAiClient($client, new NullLogger(), app(CategorySlugNormalizer::class));

        $result = $service->generateVideoSeo([
            'raw_title' => 'title',
            'raw_description' => 'desc',
            'raw_tags' => 'tag1,tag2,tag3',
            'duration_seconds' => 120,
            'source_name' => 'source',
        ]);

        $this->assertSame('real-amateur', $result['category_slug']);
    }
}
