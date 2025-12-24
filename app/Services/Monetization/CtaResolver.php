<?php

namespace App\Services\Monetization;

use App\Models\Video;

class CtaResolver
{
    public const CTA_KEYS = ['cams', 'membership', 'dating'];

    public function resolve(Video $video): array
    {
        $ctaConfig = config('candidboys.monetization');
        $sourceOverrides = $video->source?->settings['partner_links'] ?? [];
        $partnerLinks = array_replace_recursive($ctaConfig['partner_links'] ?? [], $sourceOverrides);
        $ctaTemplate = $ctaConfig['cta_templates'][$video->category_slug] ?? $ctaConfig['cta_templates']['default'] ?? '';

        return [
            'cams' => [
                'title' => 'Cam en vivo',
                'label' => $partnerLinks['cams']['label'] ?? 'Watch live',
                'url' => $partnerLinks['cams']['url'] ?? null,
                'description' => $partnerLinks['cams']['template'] ?? $ctaTemplate,
            ],
            'membership' => [
                'title' => 'Membresía',
                'label' => $partnerLinks['membership']['label'] ?? 'Watch full scene',
                'url' => $partnerLinks['membership']['url'] ?? null,
                'description' => $partnerLinks['membership']['template'] ?? $ctaTemplate,
            ],
            'dating' => [
                'title' => 'Dating',
                'label' => $partnerLinks['dating']['label'] ?? 'Meet guys',
                'url' => $partnerLinks['dating']['url'] ?? null,
                'description' => $partnerLinks['dating']['template'] ?? $ctaTemplate,
            ],
        ];
    }

    public function destination(Video $video, string $ctaKey): ?string
    {
        if (!in_array($ctaKey, self::CTA_KEYS, true)) {
            return null;
        }

        $resolved = $this->resolve($video);
        $entry = $resolved[$ctaKey] ?? null;

        if (!$entry || empty($entry['url'])) {
            return null;
        }

        return $entry['url'];
    }
}
