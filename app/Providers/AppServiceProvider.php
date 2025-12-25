<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use GuzzleHttp\Client;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\Video;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(Client::class, function () {
            return new Client();
        });
    }

    public function boot(): void
    {
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        if ($this->app->environment('testing')) {
            Vite::useBuildDirectory('tests');
            Video::disableSearchSyncing();
        }

        RateLimiter::for('search', function () {
            return Limit::perMinute($this->rateLimitValue('search'));
        });

        RateLimiter::for('video', function () {
            return Limit::perMinute($this->rateLimitValue('video'));
        });

        RateLimiter::for('admin_login', function () {
            return Limit::perMinute($this->rateLimitValue('admin_login'));
        });

        RateLimiter::for('admin', function () {
            return Limit::perMinute($this->rateLimitValue('admin'));
        });

        RateLimiter::for('public_contact', function () {
            return Limit::perMinute($this->rateLimitValue('public_contact'));
        });

        RateLimiter::for('public_takedown', function () {
            return Limit::perMinute($this->rateLimitValue('public_takedown'));
        });

        RateLimiter::for('video_events', function () {
            return Limit::perMinute($this->rateLimitValue('video_events'));
        });
    }

    private function rateLimitValue(string $key): int
    {
        $value = config("candidboys.security.rate_limits.{$key}", 60);

        if (is_string($value) && str_contains($value, '/')) {
            return (int) explode('/', $value)[0];
        }

        return (int) $value;
    }

}
