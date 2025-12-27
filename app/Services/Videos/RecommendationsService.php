<?php

namespace App\Services\Videos;

use App\Models\Video;
use App\Models\VideoView;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class RecommendationsService
{
    public function profile(string $deviceHash): array
    {
        $historyLimit = (int) config('videos.recommendation_history_limit', 100);
        $viewedVideoIds = $this->recentVideoIds($deviceHash, $historyLimit);

        return $this->profileFromIds($viewedVideoIds);
    }

    public function recommended(string $deviceHash, int $limit = null): Collection
    {
        $limit = $limit ?? (int) config('videos.recommendation_limit', 16);
        $historyLimit = (int) config('videos.recommendation_history_limit', 100);
        $viewedVideoIds = $this->recentVideoIds($deviceHash, $historyLimit);

        if ($viewedVideoIds->isEmpty()) {
            return collect();
        }

        $profile = $this->profileFromIds($viewedVideoIds);
        $categories = $profile['categories'];
        $tags = $profile['tags'];
        $entities = $profile['entities'];

        if (empty($categories) && empty($tags) && empty($entities)) {
            return collect();
        }

        $query = Video::published()
            ->withSum('viewsDaily', 'views')
            ->withCount('likes')
            ->whereNotIn('id', $viewedVideoIds)
            ->where(function ($subQuery) use ($categories, $tags, $entities) {
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

                if (!empty($entities)) {
                    $subQuery->orWhereIn('id', function ($entityQuery) use ($entities) {
                        $entityQuery->select('video_id')
                            ->from('entity_video')
                            ->whereIn('entity_id', $entities);
                    });
                }
            })
            ->orderByRaw('coalesce(likes_count, 0) + coalesce(views_daily_sum_views, 0) desc')
            ->orderByDesc('published_at')
            ->limit($limit);

        if (DB::getDriverName() === 'sqlite') {
            $query = Video::published()
                ->withSum('viewsDaily', 'views')
                ->withCount('likes')
                ->whereNotIn('id', $viewedVideoIds)
                ->when(!empty($categories), function ($subQuery) use ($categories) {
                    $subQuery->whereIn('category_slug', $categories);
                })
                ->when(empty($categories) && !empty($tags), function ($subQuery) {
                    $subQuery->whereNotNull('raw_tags');
                })
                ->when(!empty($entities), function ($subQuery) use ($entities) {
                    $subQuery->orWhereIn('id', function ($entityQuery) use ($entities) {
                        $entityQuery->select('video_id')
                            ->from('entity_video')
                            ->whereIn('entity_id', $entities);
                    });
                })
                ->orderByRaw('coalesce(likes_count, 0) + coalesce(views_daily_sum_views, 0) desc')
                ->orderByDesc('published_at')
                ->limit($limit);
        }

        $videos = $query->get();

        if (DB::getDriverName() === 'sqlite' && empty($categories) && !empty($tags)) {
            $videos = $videos->filter(function (Video $video) use ($tags) {
                return !empty(array_intersect($video->raw_tags ?? [], $tags));
            })->values();
        }

        return $videos;
    }

    private function recentVideoIds(string $deviceHash, int $limit): Collection
    {
        return VideoView::query()
            ->where('device_hash', $deviceHash)
            ->orderByDesc('viewed_at')
            ->limit($limit)
            ->pluck('video_id')
            ->unique()
            ->values();
    }

    private function profileFromIds(Collection $viewedVideoIds): array
    {
        if ($viewedVideoIds->isEmpty()) {
            return ['categories' => [], 'tags' => [], 'entities' => []];
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
            'entities' => $this->topEntities($viewedVideoIds),
        ];
    }

    private function topEntities(Collection $viewedVideoIds): array
    {
        return DB::table('entity_video')
            ->select('entity_id', DB::raw('count(*) as total'))
            ->whereIn('video_id', $viewedVideoIds)
            ->groupBy('entity_id')
            ->orderByDesc('total')
            ->limit(5)
            ->pluck('entity_id')
            ->values()
            ->all();
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
}
