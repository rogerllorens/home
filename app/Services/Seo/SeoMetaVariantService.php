<?php

namespace App\Services\Seo;

use App\Models\SeoMetaVariant;
use App\Models\SeoMetaVariantLog;
use Illuminate\Http\Request;

class SeoMetaVariantService
{
    public function select(string $pageType, ?int $pageId, string $defaultTitle, string $defaultDescription, Request $request): array
    {
        $winner = SeoMetaVariant::query()
            ->where('page_type', $pageType)
            ->when($pageId !== null, fn ($query) => $query->where('page_id', $pageId))
            ->where('is_winner', true)
            ->first();

        if ($winner) {
            $this->log($winner, $pageType, $pageId, $request);
            return [
                'title' => $winner->title,
                'description' => $winner->description,
                'variant' => $winner,
            ];
        }

        $variants = SeoMetaVariant::query()
            ->where('page_type', $pageType)
            ->when($pageId !== null, fn ($query) => $query->where('page_id', $pageId))
            ->get();

        if ($variants->isEmpty()) {
            return [
                'title' => $defaultTitle,
                'description' => $defaultDescription,
                'variant' => null,
            ];
        }

        $variant = $this->weightedPick($variants->all());
        $this->log($variant, $pageType, $pageId, $request);

        return [
            'title' => $variant->title,
            'description' => $variant->description,
            'variant' => $variant,
        ];
    }

    private function weightedPick(array $variants): SeoMetaVariant
    {
        $total = array_sum(array_map(fn (SeoMetaVariant $variant) => max(1, $variant->weight), $variants));
        $roll = random_int(1, max(1, $total));
        $cursor = 0;

        foreach ($variants as $variant) {
            $cursor += max(1, $variant->weight);
            if ($roll <= $cursor) {
                return $variant;
            }
        }

        return $variants[0];
    }

    private function log(SeoMetaVariant $variant, string $pageType, ?int $pageId, Request $request): void
    {
        SeoMetaVariantLog::create([
            'seo_meta_variant_id' => $variant->id,
            'page_type' => $pageType,
            'page_id' => $pageId,
            'is_organic' => $this->isOrganic($request),
            'created_at' => now(),
        ]);
    }

    private function isOrganic(Request $request): bool
    {
        $referrer = (string) $request->headers->get('referer', '');
        if ($referrer === '') {
            return false;
        }

        $searchHosts = ['google.', 'bing.', 'duckduckgo.', 'yahoo.', 'yandex.'];
        foreach ($searchHosts as $host) {
            if (str_contains($referrer, $host)) {
                return true;
            }
        }

        return false;
    }
}
