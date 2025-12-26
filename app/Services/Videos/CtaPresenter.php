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
        $prelanders = config('cta.prelanders.enabled', []);

        return collect($ctaDefinitions)
            ->map(fn (array $cta, string $key) => array_merge($cta, ['key' => $key]))
            ->filter(fn ($cta) => !empty($cta['url']))
            ->sortBy(function (array $cta, string $key) use ($priorityOrder) {
                $index = array_search($cta['key'], $priorityOrder, true);
                return $index === false ? 99 : $index;
            })
            ->values()
            ->map(function (array $cta, int $index) use ($video, $placement, $prelanders) {
                $key = $cta['key'];
                $variant = $this->variantFor();
                $cta = $this->resolver->applyVariant($cta, $key, $variant);
                $cta['key'] = $key;
                $cta['variant'] = $variant;
                if ($placement === 'video_detail' && $index === 0 && in_array($key, $prelanders, true)) {
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
                        'landing_type' => 'direct',
                    ]);
                }
                return $cta;
            })
            ->all();
    }

    private function variantFor(): string
    {
        return random_int(0, 1) === 0 ? 'A' : 'B';
    }
}
