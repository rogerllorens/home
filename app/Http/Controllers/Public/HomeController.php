<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Video;
use App\Models\VideoViewHistory;
use App\Enums\VideoStatus;
use App\Support\PublicCache;
use App\Support\DeviceHash;
use App\Services\Personalization\HomeFeedService;
use App\Services\Videos\RecommendationsService;
use App\Services\Videos\VideoScoreService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function __invoke(Request $request): View
    {
        $sort = $request->query('sort', 'recent');
        $duration = $request->query('duration');
        $durationFilter = in_array($duration, ['short', 'medium', 'long'], true) ? $duration : null;
        $date = $request->query('date');
        $dateFilter = in_array($date, ['24h', 'week', 'month', 'all'], true) ? $date : 'all';
        $page = (int) $request->query('page', 1);

        $durationKey = $durationFilter ?? 'all';
        $cacheKey = PublicCache::key("home:sort:{$sort}:duration:{$durationKey}:date:{$dateFilter}:page:{$page}");

        $payload = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($sort, $durationFilter, $dateFilter) {
            $scoreService = app(VideoScoreService::class);
            $heroVideos = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->withSum('viewsDaily', 'views')
                ->orderByDesc('published_at')
                ->take(3)
                ->get();

            $categorySlugs = [
                'couples',
                'first-time',
                'romantic',
                'playful',
                'massage',
            ];

            $categorySections = collect($categorySlugs)
                ->mapWithKeys(function (string $slug) {
                    $videos = Video::published()
                        ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                        ->withSum('viewsDaily', 'views')
                        ->where('category_slug', $slug)
                        ->orderByDesc('published_at')
                        ->take(12)
                        ->get();

                    return [$slug => $videos];
                })
                ->filter(fn ($videos) => $videos->isNotEmpty());

            $feedQuery = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->withSum('viewsDaily', 'views');

            $feedQuery = match ($durationFilter) {
                'short' => $feedQuery->whereBetween('duration_seconds', [1, 300]),
                'medium' => $feedQuery->whereBetween('duration_seconds', [301, 900]),
                'long' => $feedQuery->where('duration_seconds', '>=', 901),
                default => $feedQuery,
            };

            $feedQuery = match ($dateFilter) {
                '24h' => $feedQuery->where('published_at', '>=', now()->subDay()),
                'week' => $feedQuery->where('published_at', '>=', now()->subDays(7)),
                'month' => $feedQuery->where('published_at', '>=', now()->subDays(30)),
                default => $feedQuery,
            };

            $feedQuery = match ($sort) {
                'views' => $feedQuery->orderByDesc('views_daily_sum_views')->orderByDesc('published_at'),
                'longest' => $feedQuery->orderByDesc('duration_seconds')->orderByDesc('published_at'),
                default => $feedQuery->orderByDesc('published_at'),
            };

            $latestVideos = $feedQuery->paginate(24)->withQueryString();

            $trendingVideos = $scoreService->getTrending(7, 12);

            $newThisWeek = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->withSum('viewsDaily', 'views')
                ->withCount('likes')
                ->where('published_at', '>=', now()->subDays(7))
                ->orderByDesc('published_at')
                ->take(12)
                ->get();

            $recentlyAddedVideos = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->withSum('viewsDaily', 'views')
                ->orderByDesc('published_at')
                ->take(12)
                ->get();

            $mostViewedVideos = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->withSum('viewsDaily', 'views')
                ->orderByDesc('views_daily_sum_views')
                ->orderByDesc('published_at')
                ->take(12)
                ->get();

            $reelsVideos = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->withSum('viewsDaily', 'views')
                ->whereNotNull('duration_seconds')
                ->where('duration_seconds', '<=', 120)
                ->orderByDesc('published_at')
                ->take(12)
                ->get();

            $featuredCollections = Collection::query()
                ->where('is_public', true)
                ->orderByDesc('updated_at')
                ->take(4)
                ->get();

            if (DB::getDriverName() === 'sqlite') {
                $popularTags = Video::query()
                    ->where('status', VideoStatus::Published->value)
                    ->whereNotNull('raw_tags')
                    ->get(['raw_tags'])
                    ->flatMap(fn (Video $video) => $video->raw_tags ?? [])
                    ->countBy()
                    ->sortDesc()
                    ->take(8)
                    ->map(fn ($total, $tag) => (object) ['tag' => $tag, 'total' => $total])
                    ->values();
            } else {
                $popularTags = DB::table('videos')
                    ->selectRaw('unnest(raw_tags) as tag, count(*) as total')
                    ->where('status', VideoStatus::Published->value)
                    ->whereNotNull('raw_tags')
                    ->groupBy('tag')
                    ->orderByDesc('total')
                    ->limit(8)
                    ->get();
            }

            $quickCategories = collect(config('candidboys.categories_controlled', []))
                ->take(6)
                ->map(fn (string $slug) => [
                    'slug' => $slug,
                    'label' => \Illuminate\Support\Str::headline($slug),
                ])
                ->values();

            $quickTags = collect($popularTags)
                ->take(6)
                ->map(fn ($tag) => (object) ['tag' => $tag->tag])
                ->values();

            return compact(
                'heroVideos',
                'categorySections',
                'latestVideos',
                'popularTags',
                'trendingVideos',
                'newThisWeek',
                'recentlyAddedVideos',
                'mostViewedVideos',
                'reelsVideos',
                'featuredCollections',
                'quickCategories',
                'quickTags'
            );
        });

        $continueWatching = collect();
        $recommendedVideos = collect();
        $personalizedSections = collect();
        $hasPersonalizedSections = false;
        $deviceHash = DeviceHash::fromRequest($request);
        if ($deviceHash) {
            $personalization = app(HomeFeedService::class)->build($deviceHash);
            $personalizedSections = collect($personalization['sections'] ?? []);
            $hasPersonalizedSections = (bool) ($personalization['has_history'] ?? false);
        }

        if ($deviceHash && !$hasPersonalizedSections) {
            $continueLimit = (int) config('videos.continue_watching_limit', 10);
            $continueIds = VideoViewHistory::query()
                ->where('device_hash', $deviceHash)
                ->orderByDesc('last_watched_at')
                ->limit($continueLimit)
                ->pluck('video_id')
                ->unique()
                ->values()
                ->all();

            if (!empty($continueIds)) {
                $continueWatching = Video::published()
                    ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                    ->withSum('viewsDaily', 'views')
                    ->whereIn('id', $continueIds)
                    ->get()
                    ->sortBy(fn ($video) => array_search($video->id, $continueIds, true))
                    ->values();
            }

            $recommendations = app(RecommendationsService::class);
            $recommendedVideos = $recommendations->recommended($deviceHash, 12, [], false);
        }

        return view('public.home', [
            ...$payload,
            'sort' => $sort,
            'duration' => $durationFilter,
            'date' => $dateFilter,
            'continueWatching' => $continueWatching,
            'recommendedVideos' => $recommendedVideos,
            'personalizedSections' => $personalizedSections,
            'hasPersonalizedSections' => $hasPersonalizedSections,
            'featuredCollections' => $payload['featuredCollections'] ?? collect(),
        ]);
    }
}
