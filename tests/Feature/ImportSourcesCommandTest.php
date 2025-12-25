<?php

namespace Tests\Feature;

use App\DTO\VideoCandidate;
use App\Enums\SourceType;
use App\Models\ImportRun;
use App\Models\Source;
use App\Models\Video;
use App\Services\Import\FeedJsonAdapter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class ImportSourcesCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_sources_creates_videos_and_skips_duplicates(): void
    {
        $source = Source::factory()->create([
            'type' => SourceType::FeedJson,
            'settings' => [
                'allow_iframe_domains' => ['player.example.com'],
            ],
        ]);

        $fakeAdapter = new class {
            public function fetchCandidates(Source $source): array
            {
                return [
                    new VideoCandidate(
                        externalId: 'ext-1',
                        embedUrl: 'https://player.example.com/embed/1',
                        thumbnailUrl: '',
                        rawTitle: 'Video 1'
                    ),
                    new VideoCandidate(
                        externalId: 'ext-2',
                        embedUrl: 'https://player.example.com/embed/1',
                        thumbnailUrl: '',
                        rawTitle: 'Video 2'
                    ),
                    new VideoCandidate(
                        externalId: '',
                        embedUrl: '',
                        thumbnailUrl: '',
                        rawTitle: ''
                    ),
                ];
            }
        };

        $this->app->instance(FeedJsonAdapter::class, $fakeAdapter);

        Artisan::call('sources:import');

        $this->assertSame(1, Video::count());
        $video = Video::first();
        $this->assertSame(1, $video->duplicate_count);

        $run = ImportRun::first();
        $this->assertNotNull($run);
        $this->assertSame(1, $run->meta['invalid_count']);
    }
}
