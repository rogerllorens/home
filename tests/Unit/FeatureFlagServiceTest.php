<?php

namespace Tests\Unit;

use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FeatureFlagServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_variant_is_deterministic_per_device(): void
    {
        config()->set('features.flags.test_flag', [
            'active' => true,
            'variants' => [
                ['name' => 'A', 'weight' => 50],
                ['name' => 'B', 'weight' => 50],
            ],
        ]);

        $service = app(FeatureFlagService::class);
        $variantOne = $service->variantFor('test_flag', 'device-123');
        $variantTwo = $service->variantFor('test_flag', 'device-123');

        $this->assertSame($variantOne, $variantTwo);
    }

    public function test_variant_distribution_is_reasonable(): void
    {
        config()->set('features.flags.test_flag', [
            'active' => true,
            'variants' => [
                ['name' => 'A', 'weight' => 70],
                ['name' => 'B', 'weight' => 30],
            ],
        ]);

        $service = app(FeatureFlagService::class);
        $counts = ['A' => 0, 'B' => 0];

        for ($i = 0; $i < 200; $i++) {
            $variant = $service->variantFor('test_flag', 'device-'.$i);
            $counts[$variant] = ($counts[$variant] ?? 0) + 1;
        }

        $this->assertGreaterThan(100, $counts['A']);
        $this->assertGreaterThan(40, $counts['B']);
    }
}
