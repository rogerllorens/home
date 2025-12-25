<?php

namespace Tests\Feature;

use App\Enums\VideoStatus;
use App\Models\Video;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Scout\EngineManager;
use Laravel\Scout\Engines\Engine;
use Laravel\Scout\Builder;
use Tests\TestCase;

class SearchFallbackTest extends TestCase
{
    use RefreshDatabase;

    public function test_search_falls_back_when_meilisearch_unavailable(): void
    {
        config([
            'scout.driver' => 'meilisearch',
            'scout.meilisearch.host' => 'http://meili.test',
        ]);

        Http::fake([
            'http://meili.test/health' => Http::response(null, 500),
        ]);

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Amazing Search Result',
        ]);

        $response = $this->get(route('public.search', ['q' => 'Amazing']));

        $response->assertOk();
        $response->assertSee($video->seo_title);
    }

    public function test_search_uses_meilisearch_when_available(): void
    {
        config([
            'scout.driver' => 'meilisearch',
            'scout.meilisearch.host' => 'http://meili.test',
        ]);

        Http::fake([
            'http://meili.test/health' => Http::response(['status' => 'available'], 200),
        ]);

        $video = Video::factory()->create([
            'status' => VideoStatus::Published,
            'seo_title' => 'Scout Result',
        ]);

        app(EngineManager::class)->extend('meilisearch', function () use ($video) {
            return new class([$video->id]) extends Engine {
                public function __construct(private array $ids)
                {
                }

                public function update($models): void {}
                public function delete($models): void {}
                public function flush($model): void {}
                public function createIndex($name, array $options = []): void {}
                public function deleteIndex($name): void {}

                public function search(Builder $builder): array
                {
                    return ['results' => $this->results()];
                }

                public function paginate(Builder $builder, $perPage, $page): array
                {
                    return [
                        'results' => $this->results(),
                        'total' => count($this->ids),
                    ];
                }

                public function mapIds($results)
                {
                    return collect(array_map(fn ($row) => $row['id'], $results['results'] ?? []));
                }

                public function map(Builder $builder, $results, $model)
                {
                    $ids = array_map(fn ($row) => $row['id'], $results['results']);
                    return $model::whereIn('id', $ids)->get();
                }

                public function lazyMap(Builder $builder, $results, $model)
                {
                    $ids = array_map(fn ($row) => $row['id'], $results['results']);
                    return $model::whereIn('id', $ids)->cursor();
                }

                public function getTotalCount($results): int
                {
                    return (int) ($results['total'] ?? 0);
                }

                private function results(): array
                {
                    return array_map(fn ($id) => ['id' => $id], $this->ids);
                }
            };
        });

        $response = $this->get(route('public.search', ['q' => 'Scout']));

        $response->assertOk();
        $response->assertSee($video->seo_title);
    }
}
