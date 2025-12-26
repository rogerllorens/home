<?php

namespace App\Http\Controllers\Public;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Video;
use App\Support\PublicCache;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class TaxonomyController extends Controller
{
    public function categories(): View
    {
        $cacheKey = PublicCache::key('taxonomy:categories');

        $payload = Cache::remember($cacheKey, now()->addMinutes(30), function () {
            $configCategories = collect(config('candidboys.categories_controlled', []))
                ->map(fn (string $slug) => [
                    'slug' => $slug,
                    'label' => \Illuminate\Support\Str::headline($slug),
                ]);

            $dbCategories = Category::query()
                ->where('is_public', true)
                ->orderBy('name')
                ->get(['slug', 'name'])
                ->map(fn (Category $category) => [
                    'slug' => $category->slug,
                    'label' => $category->name,
                ]);

            $categories = $configCategories
                ->merge($dbCategories)
                ->unique('slug')
                ->values();

            return compact('categories');
        });

        return view('public.categories', $payload);
    }

    public function tags(): View
    {
        $cacheKey = PublicCache::key('taxonomy:tags');

        $payload = Cache::remember($cacheKey, now()->addMinutes(30), function () {
            if (DB::getDriverName() === 'sqlite') {
                $tags = Video::query()
                    ->where('status', VideoStatus::Published->value)
                    ->whereNotNull('raw_tags')
                    ->get(['raw_tags'])
                    ->flatMap(function (Video $video) {
                        return $video->raw_tags ?? [];
                    })
                    ->countBy()
                    ->sortDesc()
                    ->take(40)
                    ->map(fn ($total, $tag) => (object) ['tag' => $tag, 'total' => $total])
                    ->values();
            } else {
                $tags = DB::table('videos')
                    ->selectRaw('unnest(raw_tags) as tag, count(*) as total')
                    ->where('status', VideoStatus::Published->value)
                    ->whereNotNull('raw_tags')
                    ->groupBy('tag')
                    ->orderByDesc('total')
                    ->limit(40)
                    ->get();
            }

            return compact('tags');
        });

        return view('public.tags', $payload);
    }
}
