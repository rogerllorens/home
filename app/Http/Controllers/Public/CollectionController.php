<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\CollectionPageview;
use Illuminate\View\View;

class CollectionController extends Controller
{
    public function index(): View
    {
        $collections = Collection::query()
            ->where('is_public', true)
            ->withCount('videos')
            ->orderBy('name')
            ->get();

        return view('public.collections.index', [
            'collections' => $collections,
        ]);
    }

    public function show(string $slug): View
    {
        $collection = Collection::query()
            ->where('slug', $slug)
            ->where('is_public', true)
            ->firstOrFail();

        CollectionPageview::create([
            'collection_id' => $collection->id,
            'viewed_at' => now(),
        ]);

        $videos = $collection->videos()
            ->published()
            ->withSum('viewsDaily', 'views')
            ->withCount('likes')
            ->orderByRaw('case when collection_video.position is null then 1 else 0 end, collection_video.position asc, videos.published_at desc')
            ->get();

        return view('public.collections.show', [
            'collection' => $collection,
            'videos' => $videos,
        ]);
    }
}
