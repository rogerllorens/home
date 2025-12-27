<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Cta;
use App\Models\Video;
use App\Services\Monetization\CtaResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\View\View;

class CtaLandingController extends Controller
{
    public function __invoke(Request $request, Cta $cta, CtaResolver $resolver): View
    {
        $copy = config("cta.prelanders.copy.{$cta->key}");
        try {
            $affiliateUrl = $resolver->defaultDestinationForCta($cta);
        } catch (\Throwable $exception) {
            Log::warning('CTA prelander destination failed', [
                'cta_id' => $cta->id,
                'cta_key' => $cta->key,
                'error' => $exception->getMessage(),
            ]);
            abort(500);
        }

        if (!$copy || !$affiliateUrl) {
            abort(404);
        }

        $videoId = $request->query('video');
        $video = $videoId ? Video::find($videoId) : null;
        $placement = $request->string('placement')->toString() ?: 'prelander';
        $variant = $request->string('variant')->toString() ?: null;

        $trackUrl = null;
        if ($video) {
            $trackUrl = route('public.cta.redirect', [
                'cta' => $cta->public_id,
                'origin' => $placement,
                'placement' => $placement,
                'variant' => $variant,
                'landing_type' => 'prelander',
                'video' => $video->id,
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
            'ctaKey' => $cta->key,
            'ctaId' => $cta->public_id,
            'copy' => $resolvedCopy,
            'affiliateUrl' => $affiliateUrl,
            'trackUrl' => $trackUrl,
        ]);
    }
}
