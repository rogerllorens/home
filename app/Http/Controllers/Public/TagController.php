<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Support\PublicCache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class TagController extends Controller
{
    public function __invoke(string $tagSlug): View
    {
        $duration = request()->query('duration');
        $durationFilter = in_array($duration, ['short', 'medium', 'long'], true) ? $duration : null;
        $date = request()->query('date');
        $dateFilter = in_array($date, ['24h', 'week', 'month', 'all'], true) ? $date : 'all';
        $sort = request()->query('sort', 'recent');
        $sortFilter = in_array($sort, ['recent', 'popular'], true) ? $sort : 'recent';
        $page = (int) request()->query('page', 1);
        $durationKey = $durationFilter ?? 'all';
        $cacheKey = PublicCache::key("tag:{$tagSlug}:duration:{$durationKey}:date:{$dateFilter}:sort:{$sortFilter}:page:{$page}");

        $payload = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($tagSlug, $durationFilter, $dateFilter, $sortFilter) {
            $query = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->withSum('viewsDaily', 'views');

            if (DB::getDriverName() === 'sqlite') {
                $query->whereRaw('raw_tags LIKE ?', ["%{$tagSlug}%"]);
            } else {
                $query->whereRaw('? = ANY(raw_tags)', [$tagSlug]);
            }

            $videos = $query
                ->tap(fn ($builder) => $this->applyFilters($builder, $durationFilter, $dateFilter, $sortFilter))
                ->paginate(18)
                ->withQueryString();

            $heading = Str::headline($tagSlug);
            $introMap = (array) trans('taxonomy.tags');
            $description = $introMap[$tagSlug] ?? __('ui.tag.description', ['tag' => $heading]);

            return compact('videos', 'heading', 'description');
        });

        return view('public.tag', [
            ...$payload,
            'tagSlug' => $tagSlug,
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
