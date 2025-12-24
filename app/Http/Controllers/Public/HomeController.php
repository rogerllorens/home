<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Support\PublicCache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function __invoke(Request $request): View
    {
        $sort = $request->query('sort', 'recent');
        $page = (int) $request->query('page', 1);

        $cacheKey = PublicCache::key("home:sort:{$sort}:page:{$page}");

        $payload = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($sort) {
            $featured = Video::published()
                ->withSum('viewsDaily', 'views')
                ->orderByDesc('published_at')
                ->first();

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

            $feedQuery = match ($sort) {
                'views' => $feedQuery->orderByDesc('views_daily_sum_views')->orderByDesc('published_at'),
                'longest' => $feedQuery->orderByDesc('duration_seconds')->orderByDesc('published_at'),
                default => $feedQuery->orderByDesc('published_at'),
            };

            $latestVideos = $feedQuery->paginate(24)->withQueryString();

            return compact('featured', 'categorySections', 'latestVideos');
        });

        return view('public.home', [
            ...$payload,
            'sort' => $sort,
        ]);
    }
}
