<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CategoryPageview;
use App\Models\Video;
use App\Support\PublicCache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;

class CategoryController extends Controller
{
    public function __invoke(string $categorySlug): View
    {
        $duration = request()->query('duration');
        $durationFilter = in_array($duration, ['short', 'medium', 'long'], true) ? $duration : null;
        $date = request()->query('date');
        $dateFilter = in_array($date, ['24h', 'week', 'month', 'all'], true) ? $date : 'all';
        $sort = request()->query('sort', 'recent');
        $sortFilter = in_array($sort, ['recent', 'popular'], true) ? $sort : 'recent';
        $page = (int) request()->query('page', 1);
        $durationKey = $durationFilter ?? 'all';
        $cacheKey = PublicCache::key("category:{$categorySlug}:duration:{$durationKey}:date:{$dateFilter}:sort:{$sortFilter}:page:{$page}");

        $category = Category::query()
            ->where('slug', $categorySlug)
            ->where('is_public', true)
            ->first();

        if ($category) {
            CategoryPageview::create([
                'category_id' => $category->id,
                'viewed_at' => now(),
            ]);
        }

        $payload = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($categorySlug, $category, $durationFilter, $dateFilter, $sortFilter) {
            if ($category) {
                $videos = $category->videos()
                    ->published()
                    ->select(['videos.id', 'videos.title', 'videos.seo_title', 'videos.thumbnail_url', 'videos.duration_seconds', 'videos.published_at', 'videos.category_slug', 'videos.raw_tags'])
                    ->withSum('viewsDaily', 'views')
                    ->tap(fn ($query) => $this->applyFilters($query, $durationFilter, $dateFilter, $sortFilter))
                    ->paginate(24)
                    ->withQueryString();

                $heading = $category->name;
                $description = $category->is_auto_managed
                    ? __('ui.category.description_auto', ['category' => $heading])
                    : __('ui.category.description_manual', ['category' => $heading]);

                return compact('videos', 'heading', 'description');
            }

            $videos = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->withSum('viewsDaily', 'views')
                ->where('category_slug', $categorySlug)
                ->tap(fn ($query) => $this->applyFilters($query, $durationFilter, $dateFilter, $sortFilter))
                ->paginate(24)
                ->withQueryString();

            $heading = Str::headline($categorySlug);
            $introMap = (array) trans('taxonomy.categories');
            $description = $introMap[$categorySlug] ?? __('ui.category.description_manual', ['category' => $heading]);

            return compact('videos', 'heading', 'description');
        });

        return view('public.category', [
            ...$payload,
            'categorySlug' => $categorySlug,
            'duration' => $durationFilter,
            'date' => $dateFilter,
            'sort' => $sortFilter,
        ]);
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
            'popular' => $query->orderByDesc('views_daily_sum_views')->orderByDesc('published_at'),
            default => $query->orderByDesc('published_at'),
        };
    }
}
