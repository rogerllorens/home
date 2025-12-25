<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class StructuredDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_page_outputs_item_list_json_ld(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'SEO title',
            'seo_description' => 'SEO description',
            'embed_ok' => true,
            'published_at' => now(),
        ]);

        $response = $this->get(route('public.home'));
        $response->assertOk();

        $jsonBlocks = $this->extractJsonLd($response->getContent());

        $itemList = collect($jsonBlocks)->first(fn ($block) => ($block['@type'] ?? null) === 'ItemList');

        $this->assertNotNull($itemList);
        $this->assertIsArray($itemList['itemListElement'] ?? null);

        $expectedUrl = route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]);

        $firstEntry = $itemList['itemListElement'][0] ?? [];
        $this->assertSame('ListItem', $firstEntry['@type'] ?? null);
        $this->assertSame($expectedUrl, $firstEntry['url'] ?? null);
    }

    public function test_video_page_outputs_video_object_json_ld(): void
    {
        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'SEO title',
            'seo_description' => 'SEO description',
            'embed_ok' => true,
            'duration_seconds' => 90,
            'published_at' => now(),
        ]);

        $video->forceFill(['views_total' => 250])->save();

        $response = $this->get(route('public.video', [
            'slug' => Str::slug($video->seo_title),
            'id' => $video->id,
        ]));

        $response->assertOk();

        $jsonBlocks = $this->extractJsonLd($response->getContent());
        $videoObject = collect($jsonBlocks)->first(fn ($block) => ($block['@type'] ?? null) === 'VideoObject');

        $this->assertNotNull($videoObject);
        $this->assertSame($video->seo_title, $videoObject['name'] ?? null);
        $this->assertSame($video->seo_description, $videoObject['description'] ?? null);
        $this->assertIsArray($videoObject['thumbnailUrl'] ?? null);
        $this->assertNotEmpty($videoObject['thumbnailUrl']);
        $this->assertSame($video->published_at?->toIso8601String(), $videoObject['uploadDate'] ?? null);
        $this->assertMatchesRegularExpression('/^PT\\d+M\\d+S$/', $videoObject['duration'] ?? '');
        $this->assertArrayHasKey('interactionStatistic', $videoObject);
    }

    private function extractJsonLd(string $html): array
    {
        preg_match_all('/<script type="application\\/ld\\+json"[^>]*>(.*?)<\\/script>/s', $html, $matches);

        return collect($matches[1] ?? [])
            ->map(fn ($json) => json_decode(trim($json), true))
            ->filter(fn ($decoded) => is_array($decoded))
            ->values()
            ->all();
    }
}
