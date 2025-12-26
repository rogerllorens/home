<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CategoryPageview;
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

        $category = Category::query()
            ->where('slug', $categorySlug)
            ->where('is_public', true)
            ->first();

        if ($category) {
            CategoryPageview::create([
                'category_id' => $category->id,
                'viewed_at' => now(),
            ]);
        }

        $payload = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($categorySlug, $category) {
            if ($category) {
                $videos = $category->videos()
                    ->published()
                    ->withSum('viewsDaily', 'views')
                    ->orderByDesc('published_at')
                    ->paginate(24)
                    ->withQueryString();

                $heading = $category->name;
                $description = $category->is_auto_managed
                    ? "Curated list of videos related to {$heading}."
                    : "Últimos videos en la categoría {$heading}.";

                return compact('videos', 'heading', 'description');
            }

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
