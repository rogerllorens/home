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
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use App\Services\Search\SearchQueryInterpreter;

class SearchController extends Controller
{
    public function __invoke(Request $request): View
    {
        $query = $request->string('q')->trim()->toString();
        $locale = app()->getLocale();
        $interpreter = app(SearchQueryInterpreter::class);
        $interpreted = $interpreter->interpret($query, $locale);
        $normalizedQuery = $interpreted['normalized'];
        [$durationFilter, $dateFilter, $sortFilter] = $this->filtersFromRequest($request, $interpreted['filters'] ?? []);

        $effectiveQuery = $interpreted['query'] ?: $query;
        $videos = $this->searchWithFallback($effectiveQuery, $durationFilter, $dateFilter, $sortFilter);
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
            $searchSuggestions = $this->suggestQueries($normalizedQuery, $locale);
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
            'duration' => $durationFilter,
            'date' => $dateFilter,
            'sort' => $sortFilter,
        ]);
    }

    public function suggestions(Request $request): JsonResponse
    {
        $query = $request->string('q')->trim()->toString();
        if (mb_strlen($query) < 2) {
            return response()->json([
                'tags' => [],
                'categories' => [],
                'videos' => [],
            ]);
        }

        $locale = app()->getLocale();
        $interpreter = app(SearchQueryInterpreter::class);
        $interpreted = $interpreter->interpret($query, $locale);
        $normalized = $interpreted['normalized'];
        $tags = $this->suggestTags($normalized);
        $categories = $this->suggestCategories($normalized);
        $videos = $this->suggestVideos($interpreted['query'] ?: $query);

        if (!empty($interpreted['tag_hints'])) {
            $tags = collect($tags)
                ->merge($interpreted['tag_hints'])
                ->unique()
                ->values()
                ->all();
        }
        if (!empty($interpreted['category_hints'])) {
            $categories = collect($categories)
                ->merge($interpreted['category_hints'])
                ->unique()
                ->values()
                ->all();
        }

        return response()->json([
            'tags' => $tags,
            'categories' => $categories,
            'videos' => $videos,
        ]);
    }

    private function searchWithFallback(string $query, ?string $durationFilter, string $dateFilter, string $sortFilter)
    {
        $hasFilters = $durationFilter || $dateFilter !== 'all' || $sortFilter !== 'recent';
        if ($query !== '' && !$hasFilters && $this->meiliAvailable() && config('scout.driver') === 'meilisearch') {
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
            ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
            ->where('status', VideoStatus::Published->value)
            ->withSum('viewsDaily', 'views')
            ->when($query !== '', function ($builder) use ($query) {
                $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
                $builder->where(function ($subQuery) use ($query, $operator) {
                    $subQuery->where('seo_title', $operator, "%{$query}%")
                        ->orWhere('title', $operator, "%{$query}%")
                        ->orWhere('seo_description', $operator, "%{$query}%")
                        ->orWhere('description', $operator, "%{$query}%");
                });
            })
            ->tap(fn ($builder) => $this->applyFilters($builder, $durationFilter, $dateFilter, $sortFilter))
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

    private function suggestQueries(string $normalizedQuery, string $locale): array
    {
        $synonyms = config('search.synonyms.'.$locale, []);
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

    private function filtersFromRequest(Request $request, array $intentFilters = []): array
    {
        $duration = $request->query('duration');
        $durationFilter = in_array($duration, ['short', 'medium', 'long'], true)
            ? $duration
            : ($intentFilters['duration'] ?? null);

        $date = $request->query('date');
        $dateFilter = in_array($date, ['24h', 'week', 'month', 'all'], true)
            ? $date
            : ($intentFilters['date'] ?? 'all');

        $sort = $request->query('sort', $intentFilters['sort'] ?? 'recent');
        $sortFilter = in_array($sort, ['recent', 'popular', 'views'], true) ? $sort : 'recent';

        return [$durationFilter, $dateFilter, $sortFilter];
    }

    private function applyFilters($query, ?string $durationFilter, string $dateFilter, string $sortFilter)
    {
        $query->when($durationFilter === 'short', fn ($q) => $q->whereBetween('duration_seconds', [1, 300]))
            ->when($durationFilter === 'medium', fn ($q) => $q->whereBetween('duration_seconds', [301, 900]))
            ->when($durationFilter === 'long', fn ($q) => $q->where('duration_seconds', '>=', 901));

        match ($dateFilter) {
            '24h' => $query->where('published_at', '>=', now()->subDay()),
            'week' => $query->where('published_at', '>=', now()->subDays(7)),
            'month' => $query->where('published_at', '>=', now()->subDays(30)),
            default => null,
        };

        return match ($sortFilter) {
            'popular', 'views' => $query->orderByDesc('views_daily_sum_views')->orderByDesc('published_at'),
            default => $query->orderByDesc('published_at'),
        };
    }

    private function suggestTags(string $normalized): array
    {
        if ($normalized === '') {
            return [];
        }

        if (DB::getDriverName() === 'sqlite') {
            $tags = Video::query()
                ->where('status', VideoStatus::Published->value)
                ->whereNotNull('raw_tags')
                ->get(['raw_tags'])
                ->flatMap(fn (Video $video) => $video->raw_tags ?? [])
                ->filter(fn ($tag) => str_starts_with((string) $tag, $normalized))
                ->unique()
                ->take(6)
                ->values()
                ->all();

            return collect($tags)
                ->map(fn ($tag) => [
                    'label' => $tag,
                    'url' => route('public.tag', $tag),
                ])
                ->values()
                ->all();
        }

        $rows = DB::select(
            'select distinct tag from videos, unnest(raw_tags) as tag where status = ? and raw_tags is not null and tag ilike ? limit 6',
            [VideoStatus::Published->value, $normalized.'%']
        );
        $tags = collect($rows)->pluck('tag')->all();

        return collect($tags)
            ->map(fn ($tag) => [
                'label' => $tag,
                'url' => route('public.tag', $tag),
            ])
            ->values()
            ->all();
    }

    private function suggestCategories(string $normalized): array
    {
        $configCategories = collect(config('candidboys.categories_controlled', []))
            ->map(fn (string $slug) => [
                'slug' => $slug,
                'label' => Str::headline($slug),
            ]);

        $dbCategories = Category::query()
            ->where('is_public', true)
            ->get(['slug', 'name'])
            ->map(fn (Category $category) => [
                'slug' => $category->slug,
                'label' => $category->name,
            ]);

        return $configCategories
            ->merge($dbCategories)
            ->unique('slug')
            ->filter(function ($category) use ($normalized) {
                return $normalized === ''
                    || str_starts_with(Str::lower($category['slug']), $normalized)
                    || str_starts_with(Str::lower($category['label']), $normalized);
            })
            ->take(6)
            ->values()
            ->map(fn ($category) => [
                'label' => $category['label'],
                'url' => route('public.category', $category['slug']),
            ])
            ->all();
    }

    private function suggestVideos(string $query): array
    {
        if ($query === '') {
            return [];
        }

        $operator = DB::getDriverName() === 'pgsql' ? 'ilike' : 'like';
        return Video::query()
            ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
            ->where('status', VideoStatus::Published->value)
            ->where(function ($builder) use ($query, $operator) {
                $builder->where('seo_title', $operator, "%{$query}%")
                    ->orWhere('title', $operator, "%{$query}%");
            })
            ->orderByDesc('published_at')
            ->limit(5)
            ->get()
            ->map(fn (Video $video) => [
                'title' => $video->seo_title ?: $video->title,
                'url' => route('public.video', [
                    'slug' => Str::slug($video->seo_title ?: $video->title),
                    'id' => $video->id,
                ]),
            ])
            ->values()
            ->all();
    }
}
