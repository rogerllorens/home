<?php

namespace App\Http\Controllers\Public;

use App\Enums\VideoStatus;
use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Services\Embeds\EmbedSanitizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Illuminate\View\View;

class VideoController extends Controller
{
    public function __invoke(string $slug, int $id, EmbedSanitizer $sanitizer): View|RedirectResponse
    {
        $video = Video::published()->findOrFail($id);
        $canonicalSlug = Str::slug($video->seo_title ?: $video->title);

        if ($slug !== $canonicalSlug) {
            return redirect()->route('public.video', ['slug' => $canonicalSlug, 'id' => $video->id], 301);
        }

        $tags = $video->raw_tags ?? [];
        $relatedQuery = Video::published()
            ->where('id', '!=', $video->id)
            ->when($video->category_slug, function ($query) use ($video) {
                $query->where('category_slug', $video->category_slug);
            });

        if (!empty($tags)) {
            $relatedQuery->whereRaw('raw_tags && ?', ['{' . implode(',', $tags) . '}']);
        }

        $related = $relatedQuery->orderByDesc('published_at')->take(6)->get();

        $ctaConfig = config('candidboys.monetization');
        $sourceOverrides = $video->source?->settings['partner_links'] ?? [];
        $partnerLinks = array_replace_recursive($ctaConfig['partner_links'] ?? [], $sourceOverrides);
        $ctaTemplate = $ctaConfig['cta_templates'][$video->category_slug] ?? $ctaConfig['cta_templates']['default'] ?? '';

        $ctas = [
            [
                'title' => 'Cam en vivo',
                'subtitle' => 'Interactúa ahora',
                'url' => $partnerLinks['cams']['url'] ?? '#',
                'description' => $partnerLinks['cams']['template'] ?? $ctaTemplate,
            ],
            [
                'title' => 'Membresía',
                'subtitle' => 'Full scene',
                'url' => $partnerLinks['membership']['url'] ?? '#',
                'description' => $partnerLinks['membership']['template'] ?? $ctaTemplate,
            ],
            [
                'title' => 'Dating',
                'subtitle' => 'Conoce gente',
                'url' => $partnerLinks['dating']['url'] ?? '#',
                'description' => $partnerLinks['dating']['template'] ?? $ctaTemplate,
            ],
        ];

        $noindex = in_array($video->status, [VideoStatus::Broken, VideoStatus::Quarantine], true)
            || !$video->embed_ok
            || $video->embed_last_ok_at === null
            || !$video->seo_title
            || !$video->seo_description;

        $sanitizedEmbed = null;
        if (!$video->embed_url && $video->embed_html) {
            $sanitizedEmbed = $sanitizer->sanitize($video->embed_html);
        }

        return view('public.video', [
            'video' => $video,
            'related' => $related,
            'ctas' => $ctas,
            'noindex' => $noindex,
            'sanitizedEmbed' => $sanitizedEmbed,
        ]);
    }
}
