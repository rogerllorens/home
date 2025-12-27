<?php

namespace App\Providers;

use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Blade;

class FeatureFlagServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(FeatureFlagService::class, fn () => new FeatureFlagService());
    }

    public function boot(): void
    {
        Blade::if('feature', function (string $key, string $variant = 'A') {
            $service = app(FeatureFlagService::class);
            $deviceHash = request()->cookie(\App\Support\DeviceHash::cookieName());
            return $service->variantFor($key, $deviceHash, $variant) === $variant;
        });
    }
}
