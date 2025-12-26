<?php

namespace App\Services\Videos;

use App\Models\Video;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RelatedVideosService
{
    public function related(Video $video, int $limit = 48): Collection
    {
        $tags = $video->raw_tags ?? [];
        $related = collect();

        $appendRelated = function ($query) use (&$related, $limit, $video): void {
            if ($related->count() >= $limit) {
                return;
            }

            $results = $query
                ->where('id', '!=', $video->id)
                ->whereNotIn('id', $related->pluck('id'))
                ->withSum('viewsDaily', 'views')
                ->orderByDesc('published_at')
                ->take($limit - $related->count())
                ->get();

            $related = $related->concat($results);
        };

        if ($video->category_slug && !empty($tags)) {
            $query = Video::published()
                ->where('category_slug', $video->category_slug);

            if (DB::getDriverName() === 'pgsql') {
                $query->whereRaw('raw_tags && ?', ['{' . implode(',', $tags) . '}']);
            } else {
                $query->where(function ($tagQuery) use ($tags) {
                    foreach ($tags as $tag) {
                        $tagQuery->orWhere('raw_tags', 'like', "%{$tag}%");
                    }
                });
            }

            $appendRelated($query);
        }

        if ($video->category_slug) {
            $appendRelated(
                Video::published()->where('category_slug', $video->category_slug)
            );
        }

        $appendRelated(Video::published());

        return $related->take($limit);
    }

    public function recommended(Video $video, int $limit = 24): Collection
    {
        $tags = $video->raw_tags ?? [];

        $baseQuery = Video::published()
            ->where('id', '!=', $video->id);

        if ($video->category_slug) {
            $baseQuery->where('category_slug', $video->category_slug);
        }

        if (!empty($tags)) {
            if (DB::getDriverName() === 'pgsql') {
                $baseQuery->whereRaw('raw_tags && ?', ['{' . implode(',', $tags) . '}']);
            } else {
                $baseQuery->where(function ($tagQuery) use ($tags) {
                    foreach ($tags as $tag) {
                        $tagQuery->orWhere('raw_tags', 'like', "%{$tag}%");
                    }
                });
            }
        }

        return $baseQuery
            ->withCount('likes')
            ->withSum('viewsDaily', 'views')
            ->get()
            ->sortByDesc(fn (Video $candidate) => $this->score($candidate))
            ->take($limit)
            ->values();
    }

    public function score(Video $video): int
    {
        $likes = (int) ($video->likes_count ?? 0);
        $views = (int) ($video->views_daily_sum_views ?? $video->display_views ?? 0);
        $publishedAt = $video->published_at ?? $video->created_at;
        $recentBonus = 0;
        if ($publishedAt) {
            $ageDays = max(0, $publishedAt->diffInDays(now()));
            $recentBonus = max(0, 7 - $ageDays);
        }

        return ($likes * 3) + $views + $recentBonus;
    }
}
