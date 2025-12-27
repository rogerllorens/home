<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\LandingPageview;
use App\Models\SearchLanding;
use App\Models\SeoLanding;
use App\Services\Search\SearchLandingService;
use App\Services\Seo\InternalLinkingService;
use App\Services\Seo\SeoLandingService;
use App\Services\Seo\SeoMetaVariantService;
use App\Services\Seo\SeoPageTracker;
use Illuminate\Http\Request;
use Illuminate\View\View;

class DiscoverController extends Controller
{
    public function __invoke(
        string $locale,
        string $slug,
        SearchLandingService $landingService,
        SeoLandingService $seoLandingService,
        SeoPageTracker $pageTracker,
        SeoMetaVariantService $metaVariants,
        InternalLinkingService $internalLinking,
        Request $request
    ): View
    {
        $landing = SearchLanding::query()
            ->where('is_public', true)
            ->where('slug', $slug)
            ->with('collection')
            ->first();

        if ($landing) {
            $videos = $landingService->videosForQuery($landing->query, 80);

            LandingPageview::create([
                'search_landing_id' => $landing->id,
                'viewed_at' => now(),
            ]);

            $defaultTitle = $landing->title;
            $defaultDescription = $landing->description;
            $meta = $metaVariants->select('discover', $landing->id, $defaultTitle, $defaultDescription, $request);
            $pageTracker->track('discover', $landing->id, $request);

            $linkedDescription = $internalLinking->linkify($landing->description, [
                'category' => $landing->query,
            ]);

            return view('public.discover', [
                'landing' => $landing,
                'videos' => $videos,
                'pageTitle' => $meta['title'],
                'pageDescription' => $meta['description'],
                'linkedDescription' => $linkedDescription,
            ]);
        }

        $seoLanding = SeoLanding::query()
            ->where('is_public', true)
            ->where('slug', $slug)
            ->firstOrFail();

        $minVideos = (int) config('seo_landings.min_videos', 8);
        $query = $seoLandingService->buildQuery($seoLanding);
        $videosCount = $query->count();

        if ($videosCount < $minVideos) {
            abort(404);
        }

        $seoLanding->update(['videos_count' => $videosCount]);

        $videos = $query->paginate(24)->withQueryString();
        $pageTracker->track('seo_landing', $seoLanding->id, $request);

        $defaultTitle = $seoLandingService->renderTitle($seoLanding);
        $defaultDescription = $seoLandingService->renderDescription($seoLanding);
        $meta = $metaVariants->select('seo_landing', $seoLanding->id, $defaultTitle, $defaultDescription, $request);

        $linkedDescription = $internalLinking->linkify($meta['description'], [
            'category' => $seoLanding->params['category'] ?? null,
            'tag' => $seoLanding->params['tag'] ?? null,
        ]);

        return view('public.seo-landing', [
            'landing' => $seoLanding,
            'videos' => $videos,
            'pageTitle' => $meta['title'],
            'pageDescription' => $meta['description'],
            'faq' => $seoLandingService->renderFaq($seoLanding),
            'tokens' => $seoLandingService->tokensForLanding($seoLanding),
            'linkedDescription' => $linkedDescription,
        ]);
    }
}
