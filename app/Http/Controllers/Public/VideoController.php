<?php

namespace App\Http\Controllers\Public;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Services\Embeds\EmbedSanitizer;
use App\Services\Videos\CtaPresenter;
use App\Services\Videos\RelatedVideosService;
use App\Services\Videos\VideoAvailabilityPolicy;
use App\Services\Videos\VideoSeoService;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class VideoController extends Controller
{
    public function __invoke(
        string $slug,
        int $id,
        EmbedSanitizer $sanitizer,
        RelatedVideosService $relatedService,
        CtaPresenter $ctaPresenter,
        VideoAvailabilityPolicy $availabilityPolicy,
        VideoSeoService $seoService
    ): View|RedirectResponse
    {
        $video = Video::findOrFail($id);
        if (!in_array($video->status, [VideoStatus::Published, VideoStatus::Ready, VideoStatus::Broken, VideoStatus::Quarantine], true)) {
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

        $ctas = $ctaPresenter->present($video, 'video_detail');
        $robots = $seoService->robots($video, $availabilityPolicy);

        $sanitizedEmbed = null;
        if (!$video->embed_url && $video->embed_html) {
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
            'sanitizedEmbed' => $sanitizedEmbed,
            'isUnavailable' => $isUnavailable,
        ]);
    }
}
