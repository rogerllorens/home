<?php

namespace App\Services\Journeys;

use App\Models\Journey;
use App\Models\Video;
use App\Models\VideoViewHistory;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class JourneyRecommendationService
{
    public function suggestForDevice(string $deviceHash, int $limit = 3): Collection
    {
        $historyIds = VideoViewHistory::query()
            ->where('device_hash', $deviceHash)
            ->orderByDesc('last_watched_at')
            ->limit(40)
            ->pluck('video_id')
            ->filter()
            ->unique()
            ->values();

        if ($historyIds->isEmpty()) {
            return collect();
        }

        $videos = Video::query()
            ->whereIn('id', $historyIds)
            ->get(['id', 'category_slug', 'raw_tags']);

        $categories = $videos->pluck('category_slug')
            ->filter()
            ->countBy()
            ->sortDesc()
            ->keys()
            ->take(3)
            ->values()
            ->all();

        $tags = $videos->flatMap(fn (Video $video) => $video->raw_tags ?? [])
            ->filter()
            ->countBy()
            ->sortDesc()
            ->keys()
            ->take(4)
            ->values()
            ->all();

        if (empty($categories) && empty($tags)) {
            return collect();
        }

        return Journey::published()
            ->whereHas('videos', function ($query) use ($categories, $tags) {
                $query->when(!empty($categories), fn ($subQuery) => $subQuery->whereIn('category_slug', $categories))
                    ->when(!empty($tags), function ($subQuery) use ($tags) {
                        if (DB::getDriverName() === 'sqlite') {
                            $subQuery->where(function ($tagQuery) use ($tags) {
                                foreach ($tags as $tag) {
                                    $tagQuery->orWhere('raw_tags', 'LIKE', "%{$tag}%");
                                }
                            });
                        } else {
                            $placeholders = implode(',', array_fill(0, count($tags), '?'));
                            $subQuery->whereRaw("raw_tags && ARRAY[{$placeholders}]::text[]", $tags);
                        }
                    });
            })
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get();
    }
}
