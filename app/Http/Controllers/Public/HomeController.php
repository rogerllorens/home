<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\VideoViewDaily;
use App\Enums\VideoStatus;
use App\Support\PublicCache;
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
        $continueIds = collect(explode(',', (string) $request->query('continue_ids', '')))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->take(10)
            ->values()
            ->all();
        $page = (int) $request->query('page', 1);

        $durationKey = $durationFilter ?? 'all';
        $continueKey = empty($continueIds) ? 'none' : implode('-', $continueIds);
        $cacheKey = PublicCache::key("home:sort:{$sort}:duration:{$durationKey}:continue:{$continueKey}:page:{$page}");

        $payload = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($sort, $durationFilter, $continueIds) {
            $heroVideos = Video::published()
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
                        ->withSum('viewsDaily', 'views')
                        ->where('category_slug', $slug)
                        ->orderByDesc('published_at')
                        ->take(12)
                        ->get();

                    return [$slug => $videos];
                })
                ->filter(fn ($videos) => $videos->isNotEmpty());

            $feedQuery = Video::published()->withSum('viewsDaily', 'views');

            $feedQuery = match ($durationFilter) {
                'short' => $feedQuery->whereBetween('duration_seconds', [1, 300]),
                'medium' => $feedQuery->whereBetween('duration_seconds', [301, 900]),
                'long' => $feedQuery->where('duration_seconds', '>=', 901),
                default => $feedQuery,
            };

            $feedQuery = match ($sort) {
                'views' => $feedQuery->orderByDesc('views_daily_sum_views')->orderByDesc('published_at'),
                'longest' => $feedQuery->orderByDesc('duration_seconds')->orderByDesc('published_at'),
                default => $feedQuery->orderByDesc('published_at'),
            };

            $latestVideos = $feedQuery->paginate(24)->withQueryString();

            $trendingIds = VideoViewDaily::query()
                ->select('video_id', DB::raw('sum(views) as total_views'))
                ->where('day', '>=', now()->subDays(7)->toDateString())
                ->groupBy('video_id')
                ->orderByDesc('total_views')
                ->limit(12)
                ->pluck('video_id')
                ->all();

            $trendingVideos = $trendingIds
                ? Video::published()
                    ->whereIn('id', $trendingIds)
                    ->withSum('viewsDaily', 'views')
                    ->get()
                    ->sortBy(fn ($video) => array_search($video->id, $trendingIds, true))
                    ->values()
                : collect();

            $newThisWeek = Video::published()
                ->withSum('viewsDaily', 'views')
                ->where('published_at', '>=', now()->subDays(7))
                ->orderByDesc('published_at')
                ->take(12)
                ->get();

            $continueWatching = collect();
            if (!empty($continueIds)) {
                $continueWatching = Video::published()
                    ->whereIn('id', $continueIds)
                    ->get()
                    ->sortBy(fn ($video) => array_search($video->id, $continueIds, true))
                    ->values();
            }

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

            return compact('heroVideos', 'categorySections', 'latestVideos', 'popularTags', 'trendingVideos', 'newThisWeek', 'continueWatching');
        });

        return view('public.home', [
            ...$payload,
            'sort' => $sort,
            'duration' => $durationFilter,
            'continueIds' => $continueIds,
        ]);
    }
}
