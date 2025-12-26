<?php

namespace App\Http\Controllers\Public;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Models\VideoView;
use App\Models\Favorite;
use App\Models\VideoViewHistory;
use App\Services\Embeds\EmbedDomainMatcher;
use App\Services\Embeds\EmbedSanitizer;
use App\Services\Embeds\EmbedUrlCanonicalizer;
use App\Services\Videos\CtaPresenter;
use App\Services\Videos\RelatedVideosService;
use App\Services\Videos\VideoAvailabilityPolicy;
use App\Services\Videos\RecommendationsService;
use App\Services\Videos\VideoSeoService;
use App\Support\DeviceHash;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class VideoController extends Controller
{
    public function __invoke(
        string $slug,
        int $id,
        \Illuminate\Http\Request $request,
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

        $video->load(['source']);
        $video->loadSum('viewsDaily', 'views');
        $video->loadCount('likes');
        $deviceHash = DeviceHash::ensure($request);
        $video->setAttribute('liked_by_device', false);
        $video->setAttribute(
            'liked_by_device',
            $video->likes()->where('device_hash', $deviceHash)->exists()
        );
        $video->setAttribute(
            'favorited_by_device',
            Favorite::query()
                ->where('device_hash', $deviceHash)
                ->where('video_id', $video->id)
                ->exists()
        );

        $rateLimitMinutes = (int) config('videos.view_rate_limit_minutes', 30);
        $recentViewExists = VideoView::query()
            ->where('video_id', $video->id)
            ->where('device_hash', $deviceHash)
            ->where('viewed_at', '>=', now()->subMinutes($rateLimitMinutes))
            ->exists();

        if (!$recentViewExists) {
            VideoView::create([
                'video_id' => $video->id,
                'device_hash' => $deviceHash,
                'viewed_at' => now(),
            ]);
        }

        VideoViewHistory::updateOrCreate(
            [
                'device_hash' => $deviceHash,
                'video_id' => $video->id,
            ],
            [
                'last_watched_at' => now(),
            ]
        );

        $deviceRecommendations = collect();
        try {
            $deviceRecommendations = app(RecommendationsService::class)
                ->recommended($deviceHash, 6, [$video->id]);
        } catch (\Throwable $exception) {
            Log::warning('Video recommendations unavailable', [
                'video_id' => $video->id,
                'error' => $exception->getMessage(),
            ]);
        }

        $related = collect();
        try {
            $related = $relatedService->recommended($video);
        } catch (\Throwable $exception) {
            Log::warning('Related videos unavailable', [
                'video_id' => $video->id,
                'error' => $exception->getMessage(),
            ]);
        }
        $nextVideo = $related->first();
        $shuffleVideo = $related->count() > 1 ? $related->random() : $related->first();
        $categoryShuffle = null;
        if ($video->category_slug) {
            $categoryShuffle = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->where('category_slug', $video->category_slug)
                ->whereKeyNot($video->id)
                ->inRandomOrder()
                ->first();
        }

        $categoryRelatedVideos = collect();
        if ($video->category_slug) {
            $categoryRelatedVideos = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->withSum('viewsDaily', 'views')
                ->where('category_slug', $video->category_slug)
                ->whereKeyNot($video->id)
                ->orderByDesc('published_at')
                ->take(8)
                ->get();
        }

        $tagRelatedVideos = collect();
        $tagCandidates = array_values(array_filter(array_slice($video->raw_tags ?? [], 0, 6)));
        if (!empty($tagCandidates)) {
            $tagRelatedVideos = Video::published()
                ->select(['id', 'title', 'seo_title', 'thumbnail_url', 'duration_seconds', 'published_at', 'category_slug', 'raw_tags'])
                ->withSum('viewsDaily', 'views')
                ->whereKeyNot($video->id)
                ->whereNotNull('raw_tags')
                ->when(DB::getDriverName() === 'sqlite', function ($query) use ($tagCandidates) {
                    $query->where(function ($subQuery) use ($tagCandidates) {
                        foreach ($tagCandidates as $tag) {
                            $subQuery->orWhere('raw_tags', 'LIKE', "%{$tag}%");
                        }
                    });
                }, function ($query) use ($tagCandidates) {
                    $placeholders = implode(',', array_fill(0, count($tagCandidates), '?'));
                    $query->whereRaw("raw_tags && ARRAY[{$placeholders}]::text[]", $tagCandidates);
                })
                ->orderByDesc('published_at')
                ->take(8)
                ->get();
        }

        $ctas = [];
        try {
            $ctas = $ctaPresenter->present($video, 'video_detail');
        } catch (\Throwable $exception) {
            Log::warning('CTA presentation failed', [
                'video_id' => $video->id,
                'error' => $exception->getMessage(),
            ]);
        }
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
            'deviceRecommendations' => $deviceRecommendations,
            'nextVideo' => $nextVideo,
            'shuffleVideo' => $shuffleVideo,
            'ctas' => $ctas,
            'robots' => $robots,
            'embedUrl' => $embedUrl,
            'sanitizedEmbed' => $sanitizedEmbed,
            'isUnavailable' => $isUnavailable,
            'categoryShuffle' => $categoryShuffle,
            'categoryRelatedVideos' => $categoryRelatedVideos,
            'tagRelatedVideos' => $tagRelatedVideos,
        ]);
    }
}
