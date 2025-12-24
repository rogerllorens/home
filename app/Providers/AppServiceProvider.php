<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use GuzzleHttp\Client;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

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
        RateLimiter::for('search', function () {
            return Limit::perMinute($this->rateLimitValue('search'));
        });

        RateLimiter::for('video', function () {
            return Limit::perMinute($this->rateLimitValue('video'));
        });

        RateLimiter::for('admin_login', function () {
            return Limit::perMinute($this->rateLimitValue('admin_login'));
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
