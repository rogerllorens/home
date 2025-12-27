<?php

namespace App\Services\Videos;

use App\Models\Favorite;
use App\Models\Video;
use App\Models\VideoViewHistory;
use App\Services\TemporalPatternsService;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RecommendationsService
{
    public function profile(string $deviceHash): array
    {
        $historyLimit = (int) config('videos.recommendation_history_limit', 100);
        $viewedVideoIds = $this->recentVideoIds($deviceHash, $historyLimit);
        $favoriteVideoIds = $this->favoriteVideoIds($deviceHash, $historyLimit);
        $profileIds = $this->mergeProfileIds($viewedVideoIds, $favoriteVideoIds);

        return $this->profileFromIds($profileIds);
    }

    public function recommended(
        string $deviceHash,
        int $limit = null,
        array $excludeIds = [],
        bool $includeFallback = true,
        ?Carbon $now = null
    ): Collection
    {
        $limit = $limit ?? (int) config('videos.recommendation_limit', 16);
        $historyLimit = (int) config('videos.recommendation_history_limit', 100);
        $viewedVideoIds = $this->recentVideoIds($deviceHash, $historyLimit);
        $favoriteVideoIds = $this->favoriteVideoIds($deviceHash, $historyLimit);
        $profileIds = $this->mergeProfileIds($viewedVideoIds, $favoriteVideoIds);
        $excludeIds = collect($excludeIds)
            ->merge($viewedVideoIds)
            ->merge($favoriteVideoIds)
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($profileIds->isEmpty() && !$includeFallback) {
            return collect();
        }

        $profile = $this->profileFromIds($profileIds);
        $categories = $profile['categories'];
        $tags = $profile['tags'];

        $temporal = app(TemporalPatternsService::class)->preferredForDevice($deviceHash, $now);
        $categories = $this->prependUnique($temporal['categories'] ?? [], $categories);
        $tags = $this->prependUnique($temporal['tags'] ?? [], $tags);

        if (empty($categories) && empty($tags) && !$includeFallback) {
            return collect();
        }

        $videos = $this->recommendedByProfile($categories, $tags, $excludeIds, $limit);

        if ($includeFallback && $videos->count() < $limit) {
            $fallback = $this->fallbackVideos($excludeIds, $limit - $videos->count());
            $videos = $videos->merge($fallback);
        }

        return $videos->unique('id')->values();
    }

    private function recentVideoIds(string $deviceHash, int $limit): Collection
    {
        return VideoViewHistory::query()
            ->where('device_hash', $deviceHash)
            ->orderByDesc('last_watched_at')
            ->limit($limit)
            ->pluck('video_id')
            ->unique()
            ->values();
    }

    private function favoriteVideoIds(string $deviceHash, int $limit): Collection
    {
        return Favorite::query()
            ->where('device_hash', $deviceHash)
            ->latest()
            ->limit($limit)
            ->pluck('video_id')
            ->unique()
            ->values();
    }

    private function mergeProfileIds(Collection $historyIds, Collection $favoriteIds): Collection
    {
        return $historyIds
            ->merge($favoriteIds)
            ->filter()
            ->unique()
            ->values();
    }

    private function profileFromIds(Collection $viewedVideoIds): array
    {
        if ($viewedVideoIds->isEmpty()) {
            return ['categories' => [], 'tags' => []];
        }

        $categories = DB::table('videos')
            ->select('category_slug', DB::raw('count(*) as total'))
            ->whereIn('id', $viewedVideoIds)
            ->whereNotNull('category_slug')
            ->groupBy('category_slug')
            ->orderByDesc('total')
            ->limit(5)
            ->pluck('category_slug')
            ->filter()
            ->values()
            ->all();

        $tags = $this->topTags($viewedVideoIds);

        return [
            'categories' => $categories,
            'tags' => $tags,
        ];
    }

    private function topTags(Collection $viewedVideoIds): array
    {
        if (DB::getDriverName() === 'sqlite') {
            return Video::query()
                ->whereIn('id', $viewedVideoIds)
                ->get(['raw_tags'])
                ->flatMap(fn (Video $video) => $video->raw_tags ?? [])
                ->countBy()
                ->sortDesc()
                ->take(8)
                ->keys()
                ->values()
                ->all();
        }

        return DB::table('videos')
            ->selectRaw('unnest(raw_tags) as tag, count(*) as total')
            ->whereIn('id', $viewedVideoIds)
            ->whereNotNull('raw_tags')
            ->groupBy('tag')
            ->orderByDesc('total')
            ->limit(8)
            ->pluck('tag')
            ->filter()
            ->values()
            ->all();
    }

    private function recommendedByProfile(array $categories, array $tags, array $excludeIds, int $limit): Collection
    {
        if (empty($categories) && empty($tags)) {
            return collect();
        }

        if (DB::getDriverName() === 'sqlite') {
            $videos = Video::published()
                ->withSum('viewsDaily', 'views')
                ->withCount('likes')
                ->when(!empty($excludeIds), fn ($query) => $query->whereNotIn('id', $excludeIds))
                ->when(!empty($categories), fn ($query) => $query->whereIn('category_slug', $categories))
                ->when(!empty($tags) && empty($categories), fn ($query) => $query->whereNotNull('raw_tags'))
                ->orderByRaw('coalesce(likes_count, 0) + coalesce(views_daily_sum_views, 0) desc')
                ->orderByDesc('published_at')
                ->limit($limit * 2)
                ->get();

            if (!empty($tags)) {
                $videos = $videos->filter(function (Video $video) use ($tags, $categories) {
                    $matchesTag = !empty(array_intersect($video->raw_tags ?? [], $tags));
                    $matchesCategory = empty($categories) ? true : in_array($video->category_slug, $categories, true);
                    return $matchesTag || $matchesCategory;
                })->values();
            }

            return $this->diversify($videos, $limit);
        }

        $query = Video::published()
            ->withSum('viewsDaily', 'views')
            ->withCount('likes')
            ->when(!empty($excludeIds), fn ($query) => $query->whereNotIn('id', $excludeIds))
            ->where(function ($subQuery) use ($categories, $tags) {
                if (!empty($categories)) {
                    $subQuery->whereIn('category_slug', $categories);
                }

                if (!empty($tags)) {
                    $placeholders = implode(',', array_fill(0, count($tags), '?'));
                    $rawTags = "raw_tags && ARRAY[{$placeholders}]::text[]";

                    if (!empty($categories)) {
                        $subQuery->orWhereRaw($rawTags, $tags);
                    } else {
                        $subQuery->whereRaw($rawTags, $tags);
                    }
                }
            })
            ->orderByRaw('coalesce(likes_count, 0) + coalesce(views_daily_sum_views, 0) desc')
            ->orderByDesc('published_at')
            ->limit($limit * 2)
            ->get();

        return $this->diversify($query, $limit);
    }

    private function fallbackVideos(array $excludeIds, int $limit): Collection
    {
        if ($limit <= 0) {
            return collect();
        }

        return Video::published()
            ->withSum('viewsDaily', 'views')
            ->withCount('likes')
            ->when(!empty($excludeIds), fn ($query) => $query->whereNotIn('id', $excludeIds))
            ->orderByDesc('views_daily_sum_views')
            ->orderByDesc('published_at')
            ->limit($limit)
            ->get();
    }

    private function diversify(Collection $videos, int $limit): Collection
    {
        if ($videos->isEmpty()) {
            return collect();
        }

        return $videos
            ->shuffle()
            ->unique('id')
            ->take($limit)
            ->values();
    }

    private function prependUnique(array $primary, array $existing): array
    {
        return collect($primary)
            ->merge($existing)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}
