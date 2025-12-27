<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\SeoLanding;
use App\Services\Seo\InternalLinkingService;
use App\Services\Seo\SeoLandingService;
use App\Services\Seo\SeoMetaVariantService;
use App\Services\Seo\SeoPageTracker;
use Illuminate\Http\Request;
use Illuminate\View\View;

class SeoLandingController extends Controller
{
    public function discover(
        string $locale,
        string $slug,
        SeoLandingService $service,
        SeoPageTracker $pageTracker,
        SeoMetaVariantService $metaVariants,
        InternalLinkingService $internalLinking,
        Request $request
    ): View
    {
        $landing = SeoLanding::query()
            ->where('slug', $slug)
            ->where('is_public', true)
            ->firstOrFail();

        return $this->renderLanding($landing, $service, $pageTracker, $metaVariants, $internalLinking, $request);
    }

    public function top(
        string $locale,
        string $category,
        string $duration,
        string $timeframe,
        SeoLandingService $service,
        SeoPageTracker $pageTracker,
        SeoMetaVariantService $metaVariants,
        InternalLinkingService $internalLinking,
        Request $request
    ): View
    {
        $slug = "{$category}/{$duration}/{$timeframe}";

        $landing = SeoLanding::query()
            ->where('slug', $slug)
            ->where('is_public', true)
            ->firstOrFail();

        return $this->renderLanding($landing, $service, $pageTracker, $metaVariants, $internalLinking, $request);
    }

    private function renderLanding(
        SeoLanding $landing,
        SeoLandingService $service,
        SeoPageTracker $pageTracker,
        SeoMetaVariantService $metaVariants,
        InternalLinkingService $internalLinking,
        Request $request
    ): View
    {
        $minVideos = (int) config('seo_landings.min_videos', 8);
        $query = $service->buildQuery($landing);
        $videosCount = $query->count();

        if ($videosCount < $minVideos) {
            abort(404);
        }

        $landing->update(['videos_count' => $videosCount]);

        $videos = $query->paginate(24)->withQueryString();
        $faq = $service->renderFaq($landing);

        $pageTracker->track('seo_landing', $landing->id, $request);
        $defaultTitle = $service->renderTitle($landing);
        $defaultDescription = $service->renderDescription($landing);
        $meta = $metaVariants->select('seo_landing', $landing->id, $defaultTitle, $defaultDescription, $request);

        $linkedDescription = $internalLinking->linkify($meta['description'], [
            'category' => $landing->params['category'] ?? null,
            'tag' => $landing->params['tag'] ?? null,
        ]);

        return view('public.seo-landing', [
            'landing' => $landing,
            'videos' => $videos,
            'pageTitle' => $meta['title'],
            'pageDescription' => $meta['description'],
            'faq' => $faq,
            'tokens' => $service->tokensForLanding($landing),
            'linkedDescription' => $linkedDescription,
        ]);
    }
}
