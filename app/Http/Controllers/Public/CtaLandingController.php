<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Services\Monetization\CtaResolver;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CtaLandingController extends Controller
{
    public function __invoke(Request $request, string $ctaKey, CtaResolver $resolver): View
    {
        $copy = config("cta.prelanders.copy.{$ctaKey}");
        $affiliateUrl = $resolver->defaultDestination($ctaKey);

        if (!$copy || !$affiliateUrl) {
            abort(404);
        }

        $videoId = $request->query('video');
        $video = $videoId ? Video::find($videoId) : null;
        $placement = $request->string('placement')->toString() ?: 'prelander';
        $variant = $request->string('variant')->toString() ?: null;

        $trackUrl = null;
        if ($video) {
            $trackUrl = route('public.cta.track', [
                'video' => $video->id,
                'ctaKey' => $ctaKey,
                'placement' => $placement,
                'variant' => $variant,
                'landing_type' => 'prelander',
            ]);
        }

        $locale = app()->getLocale();
        $resolvedCopy = $copy;
        if (is_array($copy)) {
            $resolvedCopy = [
                'title' => $copy['title'][$locale] ?? $copy['title']['en'] ?? $copy['title'] ?? null,
                'bullets' => $copy['bullets'][$locale] ?? $copy['bullets']['en'] ?? $copy['bullets'] ?? [],
            ];
        }

        return view('public.cta-landing', [
            'ctaKey' => $ctaKey,
            'copy' => $resolvedCopy,
            'affiliateUrl' => $affiliateUrl,
            'trackUrl' => $trackUrl,
        ]);
    }
}
