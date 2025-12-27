<?php

namespace App\Http\Controllers\Public;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Support\PublicCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\View\View;

class ContentMapController extends Controller
{
    public function show(): View
    {
        $titleMax = (int) config('candidboys.seo.title_max', 70);
        $descMax = (int) config('candidboys.seo.desc_max', 160);
        $pageTitle = Str::limit('Candid Boys | Mapa de contenido', $titleMax, '');
        $pageDescription = Str::limit('Explora categorías y tags con un mapa visual para descubrir contenido nuevo en segundos.', $descMax, '');

        return view('public.map', [
            'pageTitle' => $pageTitle,
            'pageDescription' => $pageDescription,
        ]);
    }

    public function data(): JsonResponse
    {
        $cacheKey = PublicCache::key('content-map');

        $payload = Cache::remember($cacheKey, now()->addMinutes(30), function () {
            $categories = DB::table('videos as v')
                ->leftJoin('categories as c', function ($join) {
                    $join->on('v.category_slug', '=', 'c.slug')
                        ->where('c.is_public', true);
                })
                ->where('v.status', VideoStatus::Published->value)
                ->whereNotNull('v.category_slug')
                ->groupBy('v.category_slug')
                ->selectRaw('v.category_slug as slug, max(c.name) as name, count(*) as total')
                ->orderByDesc('total')
                ->limit(60)
                ->get()
                ->map(fn ($row) => [
                    'slug' => $row->slug,
                    'label' => $row->name ?: Str::headline($row->slug),
                    'total' => (int) $row->total,
                ])
                ->values();

            $tags = $this->popularTags();
            $relations = $this->categoryTagRelations();

            return [
                'categories' => $categories,
                'tags' => $tags,
                'relations' => $relations,
            ];
        });

        return response()->json($payload);
    }

    private function popularTags(): Collection
    {
        if (DB::getDriverName() === 'sqlite') {
            return Video::query()
                ->where('status', VideoStatus::Published->value)
                ->whereNotNull('raw_tags')
                ->get(['raw_tags'])
                ->flatMap(function (Video $video) {
                    return $video->raw_tags ?? [];
                })
                ->countBy()
                ->sortDesc()
                ->take(40)
                ->map(fn ($total, $tag) => [
                    'tag' => $tag,
                    'total' => (int) $total,
                ])
                ->values();
        }

        return DB::table('videos')
            ->selectRaw('unnest(raw_tags) as tag, count(*) as total')
            ->where('status', VideoStatus::Published->value)
            ->whereNotNull('raw_tags')
            ->groupBy('tag')
            ->orderByDesc('total')
            ->limit(40)
            ->get()
            ->map(fn ($row) => [
                'tag' => $row->tag,
                'total' => (int) $row->total,
            ])
            ->values();
    }

    private function categoryTagRelations(): Collection
    {
        if (DB::getDriverName() === 'sqlite') {
            $totals = [];

            $videos = Video::query()
                ->where('status', VideoStatus::Published->value)
                ->whereNotNull('category_slug')
                ->whereNotNull('raw_tags')
                ->get(['category_slug', 'raw_tags']);

            foreach ($videos as $video) {
                foreach ($video->raw_tags ?? [] as $tag) {
                    $key = $video->category_slug . '|' . $tag;
                    $totals[$key] = ($totals[$key] ?? 0) + 1;
                }
            }

            return collect($totals)
                ->map(function ($total, $key) {
                    [$category, $tag] = explode('|', $key, 2);
                    return [
                        'category_slug' => $category,
                        'tag' => $tag,
                        'total' => (int) $total,
                    ];
                })
                ->sortByDesc('total')
                ->take(120)
                ->values();
        }

        return DB::table('videos')
            ->selectRaw('category_slug, unnest(raw_tags) as tag, count(*) as total')
            ->where('status', VideoStatus::Published->value)
            ->whereNotNull('category_slug')
            ->whereNotNull('raw_tags')
            ->groupBy('category_slug', 'tag')
            ->orderByDesc('total')
            ->limit(120)
            ->get()
            ->map(fn ($row) => [
                'category_slug' => $row->category_slug,
                'tag' => $row->tag,
                'total' => (int) $row->total,
            ])
            ->values();
    }
}
