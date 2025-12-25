<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Support\PublicCache;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\View\View;

class TagController extends Controller
{
    public function __invoke(string $tagSlug): View
    {
        $page = (int) request()->query('page', 1);
        $cacheKey = PublicCache::key("tag:{$tagSlug}:page:{$page}");

        $payload = Cache::remember($cacheKey, now()->addMinutes(15), function () use ($tagSlug) {
            $videos = Video::published()
                ->whereRaw('? = ANY(raw_tags)', [$tagSlug])
                ->orderByDesc('published_at')
                ->paginate(18)
                ->withQueryString();

            $heading = Str::headline($tagSlug);
            $description = "Videos destacados con el tag {$heading}.";

            return compact('videos', 'heading', 'description');
        });

        return view('public.tag', [
            ...$payload,
            'tagSlug' => $tagSlug,
        ]);
    }
}
