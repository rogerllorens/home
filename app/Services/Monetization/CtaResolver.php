<?php

namespace App\Services\Monetization;

use App\Models\Cta;
use App\Models\Video;
use Illuminate\Support\Str;

class CtaResolver
{
    public const CTA_KEYS = ['cams', 'membership', 'dating'];

    public function resolve(Video $video): array
    {
        $ctaConfig = config('candidboys.monetization');
        $sourceOverrides = $video->source?->settings['partner_links'] ?? [];
        $partnerLinks = array_replace_recursive($ctaConfig['partner_links'] ?? [], $sourceOverrides);
        $ctaTemplate = $ctaConfig['cta_templates'][$video->category_slug] ?? $ctaConfig['cta_templates']['default'] ?? '';
        $ctas = $this->ensureCtas();

        return [
            'cams' => [
                ...$this->basePayload($ctas['cams'] ?? null, 'cams'),
                'title' => 'Cam en vivo',
                'label' => $partnerLinks['cams']['label'] ?? 'Watch live',
                'url' => $partnerLinks['cams']['url'] ?? null,
                'description' => $partnerLinks['cams']['template'] ?? $ctaTemplate,
            ],
            'membership' => [
                ...$this->basePayload($ctas['membership'] ?? null, 'membership'),
                'title' => 'Membresía',
                'label' => $partnerLinks['membership']['label'] ?? 'Watch full scene',
                'url' => $partnerLinks['membership']['url'] ?? null,
                'description' => $partnerLinks['membership']['template'] ?? $ctaTemplate,
            ],
            'dating' => [
                ...$this->basePayload($ctas['dating'] ?? null, 'dating'),
                'title' => 'Dating',
                'label' => $partnerLinks['dating']['label'] ?? 'Meet guys',
                'url' => $partnerLinks['dating']['url'] ?? null,
                'description' => $partnerLinks['dating']['template'] ?? $ctaTemplate,
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

        if (!$copy) {
            return $cta;
        }

        return array_merge($cta, array_filter([
            'title' => $copy['title'] ?? null,
            'label' => $copy['label'] ?? null,
            'description' => $copy['description'] ?? null,
        ]));
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

    public function ctaForKey(string $ctaKey): ?Cta
    {
        $ctas = $this->ensureCtas();

        return $ctas[$ctaKey] ?? null;
    }

    public function defaultDestinationForCta(Cta $cta): ?string
    {
        return $cta->destination_url ?: null;
    }

    private function ensureCtas(): array
    {
        $catalog = config('candidboys.monetization.ctas', []);
        $partnerLinks = config('candidboys.monetization.partner_links', []);

        $ctas = [];
        foreach (self::CTA_KEYS as $key) {
            $definition = $catalog[$key] ?? [];
            $destinationUrl = $partnerLinks[$key]['url'] ?? null;

            $cta = Cta::firstOrNew(['key' => $key]);
            if (!$cta->public_id) {
                $cta->public_id = (string) Str::uuid();
            }
            $cta->type = $definition['type'] ?? 'link';
            $cta->positions = $definition['positions'] ?? [];
            $cta->destination_url = $destinationUrl;
            $cta->is_active = true;
            $cta->save();

            $ctas[$key] = $cta;
        }

        return $ctas;
    }

    private function basePayload(?Cta $cta, string $key): array
    {
        return [
            'id' => $cta?->id,
            'public_id' => $cta?->public_id,
            'key' => $key,
            'type' => $cta?->type ?? 'link',
            'positions' => $cta?->positions ?? [],
        ];
    }
}
