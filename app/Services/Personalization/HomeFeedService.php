<?php

namespace App\Services\Personalization;

use App\Models\Favorite;
use App\Models\Video;
use App\Models\VideoLike;
use App\Models\VideoViewHistory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HomeFeedService
{
    private const SIGNAL_LIMIT = 40;
    private const SECTION_LIMIT = 12;
    private const CONTINUE_LIMIT = 10;

    public function build(?string $deviceHash): array
    {
        if (!$deviceHash) {
            return [
                'has_history' => false,
                'sections' => collect(),
            ];
        }

        $signalVideos = $this->signalVideos($deviceHash);
        if ($signalVideos->isEmpty()) {
            return [
                'has_history' => false,
                'sections' => collect(),
            ];
        }

        $sections = collect();
        $excludedIds = [];

        $continueWatching = $this->continueWatching($deviceHash);
        if ($continueWatching->isNotEmpty()) {
            $sections->push([
                'id' => 'continue_watching',
                'title' => __('ui.home.continue_title'),
                'subtitle' => __('ui.home.continue_subtitle'),
                'videos' => $continueWatching,
            ]);
            $excludedIds = array_merge($excludedIds, $continueWatching->pluck('id')->all());
        }

        $favorites = $this->favoriteVideos($deviceHash, $excludedIds);
        if ($favorites->isNotEmpty()) {
            $sections->push([
                'id' => 'favorites',
                'title' => __('ui.home.favorites_title'),
                'subtitle' => __('ui.home.favorites_subtitle'),
                'videos' => $favorites,
            ]);
            $excludedIds = array_merge($excludedIds, $favorites->pluck('id')->all());
        }

        $topCategories = $this->topCategories($signalVideos);
        $topTags = $this->topTags($signalVideos);

        if (!empty($topCategories)) {
            $category = $topCategories[0];
            $categoryVideos = $this->videosForCategory($category, $excludedIds);
            if ($categoryVideos->isNotEmpty()) {
                $sections->push([
                    'id' => 'because_category',
                    'title' => __('ui.home.because_you_liked', ['topic' => Str::headline($category)]),
                    'subtitle' => __('ui.home.because_you_liked_subtitle'),
                    'videos' => $categoryVideos,
                ]);
                $excludedIds = array_merge($excludedIds, $categoryVideos->pluck('id')->all());
            }
        }

        if (!empty($topTags)) {
            $tag = $topTags[0];
            $tagVideos = $this->videosForTags([$tag], $excludedIds);
            if ($tagVideos->isNotEmpty()) {
                $sections->push([
                    'id' => 'because_tag',
                    'title' => __('ui.home.because_you_liked', ['topic' => '#'.$tag]),
                    'subtitle' => __('ui.home.because_you_liked_subtitle'),
                    'videos' => $tagVideos,
                ]);
                $excludedIds = array_merge($excludedIds, $tagVideos->pluck('id')->all());
            }
        }

        if (count($topCategories) > 1) {
            $trending = $this->trendingInCategories(array_slice($topCategories, 0, 3), $excludedIds);
            if ($trending->isNotEmpty()) {
                $sections->push([
                    'id' => 'trending_favorites',
                    'title' => __('ui.home.trending_favorites_title'),
                    'subtitle' => __('ui.home.trending_favorites_subtitle'),
                    'videos' => $trending,
                ]);
                $excludedIds = array_merge($excludedIds, $trending->pluck('id')->all());
            }
        }

        if (count($topTags) > 1) {
            $newInTags = $this->newInTags(array_slice($topTags, 0, 4), $excludedIds);
            if ($newInTags->isNotEmpty()) {
                $sections->push([
                    'id' => 'new_in_tags',
                    'title' => __('ui.home.new_in_tags_title'),
                    'subtitle' => __('ui.home.new_in_tags_subtitle'),
                    'videos' => $newInTags,
                ]);
            }
        }

        if ($sections->isEmpty()) {
            return [
                'has_history' => false,
                'sections' => collect(),
            ];
        }

        return [
            'has_history' => true,
            'sections' => $sections,
        ];
    }

    private function signalVideos(string $deviceHash): Collection
    {
        $signalIds = collect()
            ->merge($this->historyIds($deviceHash))
            ->merge($this->favoriteIds($deviceHash))
            ->merge($this->likedIds($deviceHash))
            ->filter()
            ->unique()
            ->values();

        if ($signalIds->isEmpty()) {
            return collect();
        }

        return Video::published()
            ->select(['id', 'category_slug', 'raw_tags'])
            ->whereIn('id', $signalIds)
            ->get();
    }

    private function historyIds(string $deviceHash): Collection
    {
        return VideoViewHistory::query()
            ->where('device_hash', $deviceHash)
            ->orderByDesc('last_watched_at')
            ->limit(self::SIGNAL_LIMIT)
            ->pluck('video_id');
    }

    private function favoriteIds(string $deviceHash): Collection
    {
        return Favorite::query()
            ->where('device_hash', $deviceHash)
            ->latest()
            ->limit(self::SIGNAL_LIMIT)
            ->pluck('video_id');
    }

    private function likedIds(string $deviceHash): Collection
    {
        return VideoLike::query()
            ->where('device_hash', $deviceHash)
            ->latest()
            ->limit(self::SIGNAL_LIMIT)
            ->pluck('video_id');
    }

    private function continueWatching(string $deviceHash): Collection
    {
        $continueIds = VideoViewHistory::query()
            ->where('device_hash', $deviceHash)
            ->orderByDesc('last_watched_at')
            ->limit(self::CONTINUE_LIMIT)
            ->pluck('video_id')
            ->unique()
            ->values()
            ->all();

        if (empty($continueIds)) {
            return collect();
        }

        return Video::published()
            ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
            ->withSum('viewsDaily', 'views')
            ->whereIn('id', $continueIds)
            ->get()
            ->sortBy(fn (Video $video) => array_search($video->id, $continueIds, true))
            ->values();
    }

    private function favoriteVideos(string $deviceHash, array $excludedIds): Collection
    {
        $favoriteIds = Favorite::query()
            ->where('device_hash', $deviceHash)
            ->latest()
            ->limit(self::SECTION_LIMIT)
            ->pluck('video_id')
            ->unique()
            ->values()
            ->all();

        if (empty($favoriteIds)) {
            return collect();
        }

        $filtered = array_values(array_diff($favoriteIds, $excludedIds));
        if (empty($filtered)) {
            return collect();
        }

        return Video::published()
            ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
            ->withSum('viewsDaily', 'views')
            ->whereIn('id', $filtered)
            ->get()
            ->sortBy(fn (Video $video) => array_search($video->id, $filtered, true))
            ->values();
    }

    private function topCategories(Collection $signalVideos): array
    {
        return $signalVideos
            ->pluck('category_slug')
            ->filter()
            ->countBy()
            ->sortDesc()
            ->keys()
            ->values()
            ->all();
    }

    private function topTags(Collection $signalVideos): array
    {
        return $signalVideos
            ->flatMap(fn (Video $video) => $video->raw_tags ?? [])
            ->filter()
            ->countBy()
            ->sortDesc()
            ->keys()
            ->values()
            ->all();
    }

    private function videosForCategory(string $category, array $excludedIds): Collection
    {
        return Video::published()
            ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
            ->withSum('viewsDaily', 'views')
            ->where('category_slug', $category)
            ->when(!empty($excludedIds), fn ($query) => $query->whereNotIn('id', $excludedIds))
            ->orderByDesc('published_at')
            ->limit(self::SECTION_LIMIT)
            ->get();
    }

    private function videosForTags(array $tags, array $excludedIds): Collection
    {
        $query = Video::published()
            ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
            ->withSum('viewsDaily', 'views')
            ->when(!empty($excludedIds), fn ($query) => $query->whereNotIn('id', $excludedIds));

        if (DB::getDriverName() === 'sqlite') {
            $query->where(function ($subQuery) use ($tags) {
                foreach ($tags as $tag) {
                    $subQuery->orWhere('raw_tags', 'LIKE', "%{$tag}%");
                }
            });
        } else {
            $placeholders = implode(',', array_fill(0, count($tags), '?'));
            $query->whereRaw("raw_tags && ARRAY[{$placeholders}]::text[]", $tags);
        }

        return $query
            ->orderByDesc('published_at')
            ->limit(self::SECTION_LIMIT)
            ->get();
    }

    private function trendingInCategories(array $categories, array $excludedIds): Collection
    {
        return Video::published()
            ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
            ->withSum('viewsDaily', 'views')
            ->whereIn('category_slug', $categories)
            ->when(!empty($excludedIds), fn ($query) => $query->whereNotIn('id', $excludedIds))
            ->orderByDesc('views_daily_sum_views')
            ->orderByDesc('published_at')
            ->limit(self::SECTION_LIMIT)
            ->get();
    }

    private function newInTags(array $tags, array $excludedIds): Collection
    {
        return $this->videosForTags($tags, $excludedIds)
            ->sortByDesc('published_at')
            ->values()
            ->take(self::SECTION_LIMIT);
    }
}
