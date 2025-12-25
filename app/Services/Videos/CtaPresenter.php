<?php

namespace App\Services\Videos;

use App\Models\Video;
use App\Services\Monetization\CtaResolver;

class CtaPresenter
{
    public function __construct(private readonly CtaResolver $resolver)
    {
    }

    public function present(Video $video, string $placement = 'video_detail'): array
    {
        $ctaDefinitions = $this->resolver->resolve($video);

        return collect($ctaDefinitions)
            ->filter(fn ($cta) => !empty($cta['url']))
            ->map(function (array $cta, string $key) use ($video, $placement) {
                $cta['key'] = $key;
                $cta['track_url'] = route('public.cta.track', [
                    'video' => $video->id,
                    'ctaKey' => $key,
                    'placement' => $placement,
                ]);
                return $cta;
            })
            ->values()
            ->all();
    }
}
