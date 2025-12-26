<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Enums\VideoStatus;
use App\Models\SearchQuery;
use App\Models\Video;
use App\Support\DeviceHash;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\View\View;

class SearchController extends Controller
{
    public function __invoke(Request $request): View
    {
        $query = $request->string('q')->trim()->toString();
        $normalizedQuery = $this->normalizeQuery($query);

        $videos = $this->searchWithFallback($query);
        $resultsCount = $this->resultsCount($videos);

        if ($query !== '') {
            SearchQuery::create([
                'query' => Str::lower(trim($query)),
                'normalized_query' => $normalizedQuery,
                'results_count' => $resultsCount,
                'device_hash' => DeviceHash::fromRequest($request),
                'created_at' => now(),
            ]);
        }

        $searchSuggestions = [];
        $categorySuggestion = null;
        $tagSuggestion = null;
        if ($query !== '' && $resultsCount === 0) {
            $searchSuggestions = $this->suggestQueries($normalizedQuery);
            $categorySuggestion = $this->categorySuggestion($normalizedQuery);
            $tagSuggestion = $this->tagSuggestion($normalizedQuery);
        }

        return view('public.search', [
            'videos' => $videos,
            'query' => $query,
            'resultsCount' => $resultsCount,
            'searchSuggestions' => $searchSuggestions,
            'categorySuggestion' => $categorySuggestion,
            'tagSuggestion' => $tagSuggestion,
        ]);
    }

    private function searchWithFallback(string $query)
    {
        if ($query !== '' && $this->meiliAvailable() && config('scout.driver') === 'meilisearch') {
            try {
                return Video::search($query)
                    ->where('status', VideoStatus::Published->value)
                    ->simplePaginate(18)
                    ->withQueryString();
            } catch (\Throwable $exception) {
                Log::debug('Search fallback to SQL', ['error' => $exception->getMessage()]);
            }
        }

        return Video::query()
            ->where('status', VideoStatus::Published->value)
            ->when($query !== '', function ($builder) use ($query) {
                $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
                $builder->where(function ($subQuery) use ($query, $operator) {
                    $subQuery->where('seo_title', $operator, "%{$query}%")
                        ->orWhere('title', $operator, "%{$query}%")
                        ->orWhere('seo_description', $operator, "%{$query}%")
                        ->orWhere('description', $operator, "%{$query}%");
                });
            })
            ->orderByDesc('published_at')
            ->paginate(18)
            ->withQueryString();
    }

    private function meiliAvailable(): bool
    {
        $host = rtrim(config('scout.meilisearch.host', ''), '/');
        if ($host === '') {
            return false;
        }

        try {
            $response = Http::timeout(2)->get("{$host}/health");
            return $response->successful();
        } catch (\Throwable $exception) {
            Log::debug('Meilisearch unavailable', ['error' => $exception->getMessage()]);
            return false;
        }
    }

    private function normalizeQuery(string $query): string
    {
        $normalized = Str::lower(trim($query));
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        $normalized = Str::ascii($normalized);

        return trim((string) $normalized);
    }

    private function resultsCount($videos): int
    {
        if (is_object($videos) && method_exists($videos, 'total')) {
            return (int) $videos->total();
        }

        if (is_object($videos) && method_exists($videos, 'count')) {
            return (int) $videos->count();
        }

        return 0;
    }

    private function suggestQueries(string $normalizedQuery): array
    {
        $synonyms = config('search.synonyms', []);
        $suggestedQueries = collect(config('search.suggested_queries', []))
            ->map(fn ($suggestion) => $this->normalizeQuery($suggestion))
            ->filter()
            ->values()
            ->all();

        $suggestions = [];
        foreach ($synonyms as $key => $variants) {
            $normalizedKey = $this->normalizeQuery($key);
            $normalizedVariants = collect($variants)
                ->map(fn ($variant) => $this->normalizeQuery($variant))
                ->filter()
                ->values()
                ->all();

            if ($normalizedQuery === $normalizedKey) {
                $suggestions = array_merge($suggestions, $normalizedVariants);
            }

            if (in_array($normalizedQuery, $normalizedVariants, true)) {
                $suggestions[] = $normalizedKey;
            }
        }

        return collect(array_merge($suggestions, $suggestedQueries))
            ->filter(fn ($suggestion) => $suggestion !== $normalizedQuery)
            ->unique()
            ->take(6)
            ->values()
            ->all();
    }

    private function categorySuggestion(string $normalizedQuery): ?string
    {
        if ($normalizedQuery === '') {
            return null;
        }

        $exists = Video::query()
            ->where('status', VideoStatus::Published->value)
            ->where('category_slug', $normalizedQuery)
            ->exists();

        return $exists ? $normalizedQuery : null;
    }

    private function tagSuggestion(string $normalizedQuery): ?string
    {
        if ($normalizedQuery === '') {
            return null;
        }

        if (DB::getDriverName() === 'sqlite') {
            $videos = Video::query()
                ->where('status', VideoStatus::Published->value)
                ->whereNotNull('raw_tags')
                ->get(['raw_tags']);

            foreach ($videos as $video) {
                if (in_array($normalizedQuery, $video->raw_tags ?? [], true)) {
                    return $normalizedQuery;
                }
            }

            return null;
        }

        $exists = DB::table('videos')
            ->where('status', VideoStatus::Published->value)
            ->whereRaw('raw_tags @> ARRAY[?]::text[]', [$normalizedQuery])
            ->exists();

        return $exists ? $normalizedQuery : null;
    }
}
