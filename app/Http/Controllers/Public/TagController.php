<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Support\Str;
use Illuminate\View\View;

class TagController extends Controller
{
    public function __invoke(string $tagSlug): View
    {
        $videos = Video::published()
            ->whereRaw('? = ANY(raw_tags)', [$tagSlug])
            ->orderByDesc('published_at')
            ->paginate(18)
            ->withQueryString();

        $heading = Str::headline($tagSlug);
        $description = "Videos destacados con el tag {$heading}.";

        return view('public.tag', compact('videos', 'tagSlug', 'heading', 'description'));
    }
}
