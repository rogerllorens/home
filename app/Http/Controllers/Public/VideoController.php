<?php

namespace App\Http\Controllers\Public;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Services\Embeds\EmbedSanitizer;
use App\Services\Monetization\CtaResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\View\View;

class VideoController extends Controller
{
    public function __invoke(string $slug, int $id, EmbedSanitizer $sanitizer, CtaResolver $ctaResolver): View|RedirectResponse
    {
        $video = Video::findOrFail($id);
        if (!in_array($video->status, [VideoStatus::Published, VideoStatus::Ready, VideoStatus::Broken, VideoStatus::Quarantine], true)) {
            abort(404);
        }
        $canonicalSlug = Str::slug($video->seo_title ?: $video->title);

        if ($slug !== $canonicalSlug) {
            return redirect()->route('public.video', ['slug' => $canonicalSlug, 'id' => $video->id], 301);
        }

        $video->loadSum('viewsDaily', 'views');
        $tags = $video->raw_tags ?? [];
        $relatedLimit = 48;
        $related = collect();

        $appendRelated = function ($query) use (&$related, $relatedLimit, $video) {
            if ($related->count() >= $relatedLimit) {
                return;
            }

            $results = $query
                ->where('id', '!=', $video->id)
                ->whereNotIn('id', $related->pluck('id'))
                ->withSum('viewsDaily', 'views')
                ->orderByDesc('published_at')
                ->take($relatedLimit - $related->count())
                ->get();

            $related = $related->concat($results);
        };

        if ($video->category_slug && !empty($tags)) {
            $appendRelated(
                Video::published()
                    ->where('category_slug', $video->category_slug)
                    ->whereRaw('raw_tags && ?', ['{' . implode(',', $tags) . '}'])
            );
        }

        if ($video->category_slug) {
            $appendRelated(
                Video::published()->where('category_slug', $video->category_slug)
            );
        }

        $appendRelated(Video::published());

        $related = $related->take($relatedLimit);
        $nextVideo = $related->first();
        $shuffleVideo = $related->count() > 1 ? $related->random() : $related->first();

        $ctaDefinitions = $ctaResolver->resolve($video);
        $ctas = collect($ctaDefinitions)
            ->filter(fn ($cta) => !empty($cta['url']))
            ->map(function (array $cta, string $key) use ($video) {
                $cta['key'] = $key;
                $cta['track_url'] = route('public.cta.track', [
                    'video' => $video->id,
                    'ctaKey' => $key,
                    'placement' => 'video_detail',
                ]);
                return $cta;
            })
            ->values()
            ->all();

        $isIndexable = $video->status === VideoStatus::Published
            && !empty($video->seo_title)
            && !empty($video->seo_description)
            && $video->embed_ok;
        $robots = $isIndexable ? 'index,follow' : 'noindex,follow';

        $sanitizedEmbed = null;
        if (!$video->embed_url && $video->embed_html) {
            $sanitizedEmbed = $sanitizer->sanitize($video->embed_html);
        }

        $isUnavailable = in_array($video->status, [VideoStatus::Broken, VideoStatus::Quarantine], true) || !$video->embed_ok;

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
