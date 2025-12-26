<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class RequestMetrics
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        $response = $next($request);
        $durationMs = (int) round((microtime(true) - $start) * 1000);

        $this->incrementMetric('metrics:request_count');
        $this->incrementMetric('metrics:request_duration_ms_sum', $durationMs);
        $this->incrementMetric('metrics:request_duration_ms_count');

        if ($response->getStatusCode() >= 500) {
            $this->incrementMetric('metrics:request_5xx_count');
        }

        return $response;
    }

    private function incrementMetric(string $key, int $by = 1): void
    {
        if (!Cache::has($key)) {
            Cache::put($key, 0, now()->addDays(7));
        }

        Cache::increment($key, $by);
    }
}
