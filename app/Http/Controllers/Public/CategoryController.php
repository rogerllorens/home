<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Support\PublicCache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;

class CategoryController extends Controller
{
    public function __invoke(string $categorySlug): View
    {
        $page = (int) request()->query('page', 1);
        $cacheKey = PublicCache::key("category:{$categorySlug}:page:{$page}");

        $payload = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($categorySlug) {
            $videos = Video::published()
                ->withSum('viewsDaily', 'views')
                ->where('category_slug', $categorySlug)
                ->orderByDesc('published_at')
                ->paginate(24)
                ->withQueryString();

            $heading = Str::headline($categorySlug);
            $introMap = config('candidboys.taxonomy_intros.categories', []);
            $description = $introMap[$categorySlug] ?? "Últimos videos en la categoría {$heading}.";

            return compact('videos', 'heading', 'description');
        });

        return view('public.category', [
            ...$payload,
            'categorySlug' => $categorySlug,
        ]);
    }
}
