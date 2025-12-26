<?php

namespace App\Http\Controllers\Public;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Services\Embeds\EmbedDomainMatcher;
use App\Services\Embeds\EmbedSanitizer;
use App\Services\Embeds\EmbedUrlCanonicalizer;
use App\Services\Videos\CtaPresenter;
use App\Services\Videos\RelatedVideosService;
use App\Services\Videos\VideoAvailabilityPolicy;
use App\Services\Videos\VideoSeoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\View\View;

class VideoController extends Controller
{
    public function __invoke(
        string $slug,
        int $id,
        EmbedSanitizer $sanitizer,
        EmbedUrlCanonicalizer $canonicalizer,
        EmbedDomainMatcher $domainMatcher,
        RelatedVideosService $relatedService,
        CtaPresenter $ctaPresenter,
        VideoAvailabilityPolicy $availabilityPolicy,
        VideoSeoService $seoService
    ): View|RedirectResponse
    {
        $video = Video::findOrFail($id);
        $status = $video->status instanceof VideoStatus
            ? $video->status
            : VideoStatus::tryFrom((string) $video->status);
        if (!$status || !in_array($status, [VideoStatus::Published, VideoStatus::Ready, VideoStatus::Broken, VideoStatus::Quarantine], true)) {
            abort(404);
        }
        $canonicalSlug = $seoService->canonicalSlug($video);

        if ($slug !== $canonicalSlug) {
            return redirect()->route('public.video', ['slug' => $canonicalSlug, 'id' => $video->id], 301);
        }

        $video->loadSum('viewsDaily', 'views');
        $related = $relatedService->related($video);
        $nextVideo = $related->first();
        $shuffleVideo = $related->count() > 1 ? $related->random() : $related->first();
        $categoryShuffle = null;
        if ($video->category_slug) {
            $categoryShuffle = Video::published()
                ->where('category_slug', $video->category_slug)
                ->whereKeyNot($video->id)
                ->inRandomOrder()
                ->first();
        }

        $ctas = $ctaPresenter->present($video, 'video_detail');
        $robots = $seoService->robots($video, $availabilityPolicy);

        $embedUrl = null;
        if ($video->embed_url) {
            $allowHttp = (bool) ($video->source?->settings['allow_http'] ?? false);
            $canonical = $canonicalizer->canonicalize($video->embed_url, $allowHttp);
            if ($canonical) {
                $host = parse_url($canonical, PHP_URL_HOST);
                $allowlist = array_merge(
                    config('candidboys.security.global_iframe_allowlist', []),
                    Arr::wrap($video->source?->settings['allow_iframe_domains'] ?? [])
                );
                $embedUrl = empty($allowlist) || $domainMatcher->isAllowed((string) $host, $allowlist)
                    ? $canonical
                    : null;
            }
        }

        $sanitizedEmbed = null;
        if (!$embedUrl && $video->embed_html) {
            $sanitizedEmbed = $sanitizer->sanitize($video->embed_html);
        }

        $isUnavailable = $availabilityPolicy->isUnavailable($video);

        return view('public.video', [
            'video' => $video,
            'related' => $related,
            'nextVideo' => $nextVideo,
            'shuffleVideo' => $shuffleVideo,
            'ctas' => $ctas,
            'robots' => $robots,
            'embedUrl' => $embedUrl,
            'sanitizedEmbed' => $sanitizedEmbed,
            'isUnavailable' => $isUnavailable,
            'categoryShuffle' => $categoryShuffle,
        ]);
    }
}
