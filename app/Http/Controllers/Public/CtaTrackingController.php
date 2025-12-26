<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Video;
use App\Services\Monetization\CtaResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CtaTrackingController extends Controller
{
    public function __invoke(Request $request, Video $video, string $ctaKey, CtaResolver $resolver): RedirectResponse
    {
        $cta = $resolver->ctaForKey($ctaKey);

        if (!$cta) {
            abort(404);
        }

        $query = array_filter([
            'origin' => $request->string('placement')->toString() ?: 'video_detail',
            'placement' => $request->string('placement')->toString() ?: 'video_detail',
            'variant' => $request->string('variant')->toString() ?: null,
            'landing_type' => $request->string('landing_type')->toString() ?: 'direct',
            'video' => $video->id,
        ]);

        return redirect()->to(route('public.cta.redirect', ['cta' => $cta->public_id]) . '?' . http_build_query($query), 302);
    }
}
