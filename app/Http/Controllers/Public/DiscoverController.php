<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\LandingPageview;
use App\Models\SearchLanding;
use App\Services\Search\SearchLandingService;
use Illuminate\View\View;

class DiscoverController extends Controller
{
    public function __invoke(string $slug, SearchLandingService $landingService): View
    {
        $landing = SearchLanding::query()
            ->where('is_public', true)
            ->where('slug', $slug)
            ->with('collection')
            ->firstOrFail();

        $videos = $landingService->videosForQuery($landing->query, 80);

        LandingPageview::create([
            'search_landing_id' => $landing->id,
            'viewed_at' => now(),
        ]);

        return view('public.discover', [
            'landing' => $landing,
            'videos' => $videos,
        ]);
    }
}
