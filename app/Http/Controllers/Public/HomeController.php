<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\View\View;

class HomeController extends Controller
{
    public function __invoke(): View
    {
        $trending = Video::published()
            ->orderByDesc('published_at')
            ->take(6)
            ->get();

        $latest = Video::published()
            ->orderByDesc('published_at')
            ->take(12)
            ->get();

        $categories = Video::published()
            ->whereNotNull('category_slug')
            ->select('category_slug')
            ->selectRaw('count(*) as total')
            ->groupBy('category_slug')
            ->orderByDesc('total')
            ->take(6)
            ->get();

        return view('public.home', compact('trending', 'latest', 'categories'));
    }
}
