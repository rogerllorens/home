<?php

namespace App\Services\Videos;

use App\Models\Video;
use Illuminate\Support\Collection;

class VideoScoreService
{
    public function score(Video $video, int $periodDays = 7): int
    {
        $likes = (int) ($video->likes_count ?? 0);
        $views = (int) ($video->views_period_sum ?? $video->views_daily_sum_views ?? $video->display_views ?? 0);
        $publishedAt = $video->published_at ?? $video->created_at;
        $recentBonus = 0;

        if ($publishedAt) {
            $ageDays = max(0, $publishedAt->diffInDays(now()));
            $recentBonus = max(0, $periodDays - $ageDays);
        }

        return ($likes * 3) + $views + $recentBonus;
    }

    public function getTrending(int $periodDays = 7, int $limit = 24): Collection
    {
        $videos = $this->baseQuery($periodDays)->get();

        return $videos
            ->sortByDesc(fn (Video $video) => $this->score($video, $periodDays))
            ->take($limit)
            ->values();
    }

    public function getTopByCategory(string $categorySlug, int $periodDays = 7, int $limit = 24): Collection
    {
        $videos = $this->baseQuery($periodDays)
            ->where('category_slug', $categorySlug)
            ->get();

        return $videos
            ->sortByDesc(fn (Video $video) => $this->score($video, $periodDays))
            ->take($limit)
            ->values();
    }

    private function baseQuery(int $periodDays)
    {
        return Video::published()
            ->withCount('likes')
            ->withSum([
                'viewsDaily as views_period_sum' => function ($query) use ($periodDays) {
                    $query->where('day', '>=', now()->subDays($periodDays)->toDateString());
                },
            ], 'views');
    }
}
