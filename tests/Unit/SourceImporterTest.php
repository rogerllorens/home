<?php

namespace Tests\Unit;

use App\DTO\VideoCandidate;
use App\Enums\SourceType;
use App\Models\Source;
use App\Models\Video;
use App\Services\CategorySlugNormalizer;
use App\Services\Embeds\EmbedDomainMatcher;
use App\Services\Embeds\EmbedUrlCanonicalizer;
use App\Services\Import\SourceAdapterInterface;
use App\Services\Import\SourceImporter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SourceImporterTest extends TestCase
{
    use RefreshDatabase;

    public function test_missing_fields_are_marked_invalid(): void
    {
        $adapter = new class implements SourceAdapterInterface {
            public function fetchCandidates(Source $source): array
            {
                return [
                    new VideoCandidate(
                        externalId: 'ext-1',
                        embedUrl: '',
                        thumbnailUrl: '',
                        rawTitle: '',
                        rawDescription: null,
                        rawTags: null,
                        durationSeconds: null,
                        sourceUrl: null,
                    ),
                ];
            }
        };

        $source = Source::factory()->create([
            'type' => SourceType::Manual,
            'settings' => [],
        ]);

        $importer = new SourceImporter(
            new EmbedUrlCanonicalizer(),
            new CategorySlugNormalizer(),
            new EmbedDomainMatcher(),
            $adapter,
            $adapter,
            $adapter,
        );

        $run = $importer->import($source);

        $this->assertSame(1, $run->meta['invalid_count']);
        $this->assertDatabaseCount('videos', 0);
    }

    public function test_duplicate_embed_url_increments_counter(): void
    {
        $adapter = new class implements SourceAdapterInterface {
            public function fetchCandidates(Source $source): array
            {
                return [
                    new VideoCandidate(
                        externalId: 'ext-2',
                        embedUrl: 'https://example.com/embed/123',
                        thumbnailUrl: 'https://example.com/thumb.jpg',
                        rawTitle: 'Title',
                        rawDescription: 'Desc',
                        rawTags: ['tag1'],
                        durationSeconds: 120,
                        sourceUrl: 'https://example.com/watch/123',
                    ),
                ];
            }
        };

        $source = Source::factory()->create([
            'type' => SourceType::Manual,
            'settings' => [
                'allow_iframe_domains' => ['example.com'],
            ],
        ]);

        $existing = Video::factory()->create([
            'source_id' => $source->id,
            'external_id' => 'ext-1',
            'embed_url' => 'https://example.com/embed/123',
            'duplicate_count' => 0,
        ]);

        $importer = new SourceImporter(
            new EmbedUrlCanonicalizer(),
            new CategorySlugNormalizer(),
            new EmbedDomainMatcher(),
            $adapter,
            $adapter,
            $adapter,
        );

        $run = $importer->import($source);

        $existing->refresh();
        $this->assertSame(1, $existing->duplicate_count);
        $this->assertSame(1, $run->meta['duplicate_count']);
        $this->assertDatabaseCount('videos', 1);
    }
}
