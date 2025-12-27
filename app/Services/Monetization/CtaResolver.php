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
        $labelLocks = collect(self::CTA_KEYS)
            ->mapWithKeys(fn ($key) => [$key => !empty($sourceOverrides[$key]['label'])])
            ->all();
        $ctaTemplate = $ctaConfig['cta_templates'][$video->category_slug] ?? $ctaConfig['cta_templates']['default'] ?? '';

        return [
            'cams' => [
                'title' => 'Cam en vivo',
                'label' => $partnerLinks['cams']['label'] ?? 'Watch live',
                'url' => $partnerLinks['cams']['url'] ?? null,
                'description' => $partnerLinks['cams']['template'] ?? $ctaTemplate,
                'label_locked' => $labelLocks['cams'] ?? false,
            ],
            'membership' => [
                'title' => 'Membresía',
                'label' => $partnerLinks['membership']['label'] ?? 'Watch full scene',
                'url' => $partnerLinks['membership']['url'] ?? null,
                'description' => $partnerLinks['membership']['template'] ?? $ctaTemplate,
                'label_locked' => $labelLocks['membership'] ?? false,
            ],
            'dating' => [
                'title' => 'Dating',
                'label' => $partnerLinks['dating']['label'] ?? 'Meet guys',
                'url' => $partnerLinks['dating']['url'] ?? null,
                'description' => $partnerLinks['dating']['template'] ?? $ctaTemplate,
                'label_locked' => $labelLocks['dating'] ?? false,
            ],
        ];
    }

    public function priorityOrder(Video $video): array
    {
        $rules = config('cta.priority', []);
        $scores = array_fill_keys(self::CTA_KEYS, 0);
        $category = (string) ($video->category_slug ?? '');
        $tags = array_map('strtolower', $video->raw_tags ?? []);
        $duration = (int) ($video->duration_seconds ?? 0);
        $quality = (int) ($video->quality_score ?? 0);

        foreach ($rules as $key => $rule) {
            $categories = array_map('strtolower', $rule['categories'] ?? []);
            $ruleTags = array_map('strtolower', $rule['tags'] ?? []);
            if ($category !== '' && in_array(strtolower($category), $categories, true)) {
                $scores[$key] += 2;
            }
            if (!empty($ruleTags)) {
                $intersection = array_intersect($tags, $ruleTags);
                if (!empty($intersection)) {
                    $scores[$key] += 2;
                }
            }
            if (isset($rule['min_duration_seconds']) && $duration >= (int) $rule['min_duration_seconds']) {
                $scores[$key] += 1;
            }
            if (isset($rule['min_quality_score']) && $quality >= (int) $rule['min_quality_score']) {
                $scores[$key] += 1;
            }
        }

        return collect(self::CTA_KEYS)
            ->sortByDesc(fn ($key) => $scores[$key] ?? 0)
            ->values()
            ->all();
    }

    public function applyVariant(array $cta, string $ctaKey, string $variant): array
    {
        $variants = config('cta.variants', []);
        $copy = $variants[$ctaKey][$variant] ?? null;

        $labelLocked = (bool) ($cta['label_locked'] ?? false);
        unset($cta['label_locked']);

        if (!$copy) {
            return $cta;
        }

        $overrides = array_filter([
            'title' => $copy['title'] ?? null,
            'label' => $copy['label'] ?? null,
            'description' => $copy['description'] ?? null,
        ]);

        if ($labelLocked) {
            unset($overrides['label']);
        }

        return array_merge($cta, $overrides);
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

    public function defaultDestination(string $ctaKey): ?string
    {
        if (!in_array($ctaKey, self::CTA_KEYS, true)) {
            return null;
        }

        $partnerLinks = config('candidboys.monetization.partner_links', []);

        return $partnerLinks[$ctaKey]['url'] ?? null;
    }
}
