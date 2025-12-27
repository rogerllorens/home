<?php

namespace App\Services;

use App\Models\Video;
use App\Models\VideoViewHistory;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class TemporalPatternsService
{
    private const LOOKBACK_DAYS = 90;
    private const MIN_COUNT = 2;

    public function preferredForDevice(string $deviceHash, ?Carbon $now = null): array
    {
        $now = $now ?? now();
        $cacheKey = "temporal_patterns:{$deviceHash}:{$now->format('YmdH')}";

        return Cache::remember($cacheKey, now()->addMinutes(15), function () use ($deviceHash, $now) {
            $hour = (int) $now->format('H');
            $dayOfWeek = (int) $now->dayOfWeek;

            if (DB::getDriverName() === 'sqlite') {
                return $this->preferredFromSqlite($deviceHash, $hour, $dayOfWeek);
            }

            return $this->preferredFromSql($deviceHash, $hour, $dayOfWeek);
        });
    }

    private function preferredFromSqlite(string $deviceHash, int $hour, int $dayOfWeek): array
    {
        $since = now()->subDays(self::LOOKBACK_DAYS);
        $history = VideoViewHistory::query()
            ->where('device_hash', $deviceHash)
            ->where('last_watched_at', '>=', $since)
            ->get(['video_id', 'last_watched_at']);

        if ($history->isEmpty()) {
            return ['categories' => [], 'tags' => []];
        }

        $videoIds = $history->pluck('video_id')->unique()->values();
        $videos = Video::query()
            ->whereIn('id', $videoIds)
            ->get(['id', 'category_slug', 'raw_tags']);

        $rows = $history->map(function ($entry) use ($videos) {
            $video = $videos->firstWhere('id', $entry->video_id);
            if (!$video) {
                return null;
            }

            $watchedAt = Carbon::parse($entry->last_watched_at);

            return [
                'hour' => (int) $watchedAt->format('H'),
                'day' => (int) $watchedAt->dayOfWeek,
                'category' => $video->category_slug,
                'tags' => $video->raw_tags ?? [],
            ];
        })->filter();

        return $this->aggregateRows($rows, $hour, $dayOfWeek);
    }

    private function preferredFromSql(string $deviceHash, int $hour, int $dayOfWeek): array
    {
        $since = now()->subDays(self::LOOKBACK_DAYS);
        $categoryRows = DB::table('video_view_histories')
            ->join('videos', 'video_view_histories.video_id', '=', 'videos.id')
            ->where('video_view_histories.device_hash', $deviceHash)
            ->where('video_view_histories.last_watched_at', '>=', $since)
            ->whereNotNull('videos.category_slug')
            ->whereRaw('extract(hour from video_view_histories.last_watched_at) = ?', [$hour])
            ->whereRaw('extract(dow from video_view_histories.last_watched_at) = ?', [$dayOfWeek])
            ->select('videos.category_slug', DB::raw('count(*) as total'))
            ->groupBy('videos.category_slug')
            ->orderByDesc('total')
            ->limit(3)
            ->get();

        $tagRows = DB::table('video_view_histories')
            ->join('videos', 'video_view_histories.video_id', '=', 'videos.id')
            ->where('video_view_histories.device_hash', $deviceHash)
            ->where('video_view_histories.last_watched_at', '>=', $since)
            ->whereNotNull('videos.raw_tags')
            ->whereRaw('extract(hour from video_view_histories.last_watched_at) = ?', [$hour])
            ->whereRaw('extract(dow from video_view_histories.last_watched_at) = ?', [$dayOfWeek])
            ->selectRaw('unnest(videos.raw_tags) as tag, count(*) as total')
            ->groupBy('tag')
            ->orderByDesc('total')
            ->limit(4)
            ->get();

        $categories = $categoryRows
            ->filter(fn ($row) => $row->total >= self::MIN_COUNT)
            ->pluck('category_slug')
            ->values()
            ->all();

        $tags = $tagRows
            ->filter(fn ($row) => $row->total >= self::MIN_COUNT)
            ->pluck('tag')
            ->values()
            ->all();

        return ['categories' => $categories, 'tags' => $tags];
    }

    private function aggregateRows(Collection $rows, int $hour, int $dayOfWeek): array
    {
        $filtered = $rows->filter(fn ($row) => $row['hour'] === $hour && $row['day'] === $dayOfWeek);

        if ($filtered->isEmpty()) {
            return ['categories' => [], 'tags' => []];
        }

        $categories = $filtered->pluck('category')
            ->filter()
            ->countBy()
            ->sortDesc()
            ->filter(fn ($count) => $count >= self::MIN_COUNT)
            ->keys()
            ->take(3)
            ->values()
            ->all();

        $tags = $filtered->flatMap(fn ($row) => $row['tags'])
            ->filter()
            ->countBy()
            ->sortDesc()
            ->filter(fn ($count) => $count >= self::MIN_COUNT)
            ->keys()
            ->take(4)
            ->values()
            ->all();

        return ['categories' => $categories, 'tags' => $tags];
    }
}
