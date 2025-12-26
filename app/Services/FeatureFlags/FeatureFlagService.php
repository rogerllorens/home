<?php

namespace App\Services\FeatureFlags;

use App\Models\FeatureFlag;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;

class FeatureFlagService
{
    public function variantFor(string $key, ?string $deviceHash, string $default = 'A'): string
    {
        if (!$deviceHash) {
            return $default;
        }

        $config = config("features.flags.{$key}");
        if (!$config) {
            return $default;
        }

        if (!(bool) ($config['active'] ?? false)) {
            return $default;
        }

        $variants = $this->normalizeVariants($config['variants'] ?? []);
        if (empty($variants)) {
            return $default;
        }

        $cacheKey = "feature_flag:{$key}:{$deviceHash}";

        return Cache::rememberForever($cacheKey, function () use ($deviceHash, $variants, $default, $key) {
            return $this->assignVariant($key, $deviceHash, $variants, $default);
        });
    }

    public function variantForRequest(string $key, ?string $deviceHash, string $default = 'A'): string
    {
        return $this->variantFor($key, $deviceHash, $default);
    }

    private function assignVariant(string $key, string $deviceHash, array $variants, string $default): string
    {
        $bucket = hexdec(substr(hash('sha256', $deviceHash.'|'.$key), 0, 8)) % 100;
        $cumulative = 0;
        foreach ($variants as $variant) {
            $cumulative += $variant['weight'];
            if ($bucket < $cumulative) {
                return $variant['name'];
            }
        }

        return $default;
    }

    private function normalizeVariants(array $variants): array
    {
        return collect($variants)
            ->map(function ($variant) {
                return [
                    'name' => (string) ($variant['name'] ?? ''),
                    'weight' => (int) ($variant['weight'] ?? 0),
                ];
            })
            ->filter(fn ($variant) => $variant['name'] !== '' && $variant['weight'] > 0)
            ->values()
            ->all();
    }

    public function activeFlags(): array
    {
        return Arr::where(config('features.flags', []), fn ($flag) => (bool) ($flag['active'] ?? false));
    }

    public function loadFromDatabase(string $key): ?FeatureFlag
    {
        return FeatureFlag::query()->where('key', $key)->where('is_active', true)->first();
    }
}
