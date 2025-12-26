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
        $priorityOrder = $this->resolver->priorityOrder($video);
        $prelanders = config('candidboys.monetization.prelanders.enabled', []);

        return collect($ctaDefinitions)
            ->filter(fn ($cta) => !empty($cta['url']))
            ->sortBy(function (array $cta, string $key) use ($priorityOrder) {
                $index = array_search($key, $priorityOrder, true);
                return $index === false ? 99 : $index;
            })
            ->map(function (array $cta, string $key) use ($video, $placement, $prelanders) {
                $variant = $this->variantFor($video, $key);
                $cta = $this->resolver->applyVariant($cta, $key, $variant);
                $cta['key'] = $key;
                $cta['variant'] = $variant;
                if ($placement === 'video_detail' && in_array($key, $prelanders, true)) {
                    $cta['track_url'] = route('public.cta.landing', ['ctaKey' => $key]).'?'.http_build_query([
                        'video' => $video->id,
                        'placement' => $placement,
                        'variant' => $variant,
                    ]);
                } else {
                    $cta['track_url'] = route('public.cta.track', [
                        'video' => $video->id,
                        'ctaKey' => $key,
                        'placement' => $placement,
                        'variant' => $variant,
                    ]);
                }
                return $cta;
            })
            ->values()
            ->all();
    }

    private function variantFor(Video $video, string $ctaKey): string
    {
        $seed = $video->id . ':' . $ctaKey;
        return crc32($seed) % 2 === 0 ? 'A' : 'B';
    }
}
