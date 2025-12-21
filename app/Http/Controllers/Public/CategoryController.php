<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Support\Str;
use Illuminate\View\View;

class CategoryController extends Controller
{
    public function __invoke(string $categorySlug): View
    {
        $videos = Video::published()
            ->withSum('viewsDaily', 'views')
            ->where('category_slug', $categorySlug)
            ->orderByDesc('published_at')
            ->paginate(24)
            ->withQueryString();

        $heading = Str::headline($categorySlug);
        $description = "Últimos videos en la categoría {$heading}.";

        return view('public.category', compact('videos', 'categorySlug', 'heading', 'description'));
    }
}
