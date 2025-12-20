<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SearchController extends Controller
{
    public function __invoke(Request $request): View
    {
        $query = $request->string('q')->trim()->toString();

        $videos = Video::published()
            ->when($query !== '', function ($builder) use ($query) {
                $builder->where('title', 'ilike', "%{$query}%")
                    ->orWhere('description', 'ilike', "%{$query}%");
            })
            ->orderByDesc('published_at')
            ->paginate(18)
            ->withQueryString();

        return view('public.search', [
            'videos' => $videos,
            'query' => $query,
        ]);
    }
}
