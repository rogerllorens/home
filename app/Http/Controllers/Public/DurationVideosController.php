<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Support\Str;
use Illuminate\View\View;

class DurationVideosController extends Controller
{
    public function global(string $range): View
    {
        $config = $this->durationConfig($range);
        $videos = $this->queryByDuration($config['min'], $config['max']);

        return view('public.duration', [
            'heading' => $config['heading'],
            'description' => $config['description'],
            'videos' => $videos,
        ]);
    }

    public function category(string $categorySlug, string $range): View
    {
        if (!in_array($categorySlug, config('candidboys.categories_controlled', []), true)) {
            abort(404);
        }

        $config = $this->durationConfig($range, $categorySlug);
        $videos = $this->queryByDuration($config['min'], $config['max'], $categorySlug);

        return view('public.duration', [
            'heading' => $config['heading'],
            'description' => $config['description'],
            'videos' => $videos,
        ]);
    }

    private function durationConfig(string $range, ?string $category = null): array
    {
        $shortMax = (int) config('videos.short_max_minutes', 8) * 60;
        $longMin = (int) config('videos.long_min_minutes', 20) * 60;
        $categoryLabel = $category ? Str::headline($category) . ' ' : '';

        if ($range === 'long') {
            return [
                'min' => $longMin,
                'max' => null,
                'heading' => "Long {$categoryLabel}videos",
                'description' => 'Videos de mayor duración, ideales para ver con calma.',
            ];
        }

        return [
            'min' => 0,
            'max' => $shortMax,
            'heading' => "Short {$categoryLabel}videos",
            'description' => 'Clips rápidos y dinámicos, perfectos para sesiones cortas.',
        ];
    }

    private function queryByDuration(int $min, ?int $max, ?string $category = null)
    {
        $query = Video::published()
            ->withSum('viewsDaily', 'views')
            ->withCount('likes')
            ->whereNotNull('duration_seconds')
            ->where('duration_seconds', '>=', $min);

        if ($max !== null) {
            $query->where('duration_seconds', '<=', $max);
        }

        if ($category) {
            $query->where('category_slug', $category);
        }

        return $query->orderByDesc('published_at')->take(48)->get();
    }
}
