<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ObservabilityController extends Controller
{
    public function health(Request $request): JsonResponse
    {
        $checks = [];
        $ok = true;

        try {
            DB::select('select 1');
            $checks['database'] = 'ok';
        } catch (\Throwable $exception) {
            $checks['database'] = 'error';
            $ok = false;
        }

        $meiliHost = rtrim((string) config('scout.meilisearch.host', ''), '/');
        if ($meiliHost === '') {
            $checks['meilisearch'] = 'skipped';
        } else {
            try {
                $response = Http::timeout(2)->get("{$meiliHost}/health");
                if ($response->ok()) {
                    $checks['meilisearch'] = 'ok';
                } else {
                    $checks['meilisearch'] = 'error';
                    $ok = false;
                }
            } catch (\Throwable $exception) {
                $checks['meilisearch'] = 'error';
                $ok = false;
            }
        }

        return response()->json([
            'status' => $ok ? 'ok' : 'degraded',
            'checks' => $checks,
            'timestamp' => now()->toIso8601String(),
            'path' => $request->path(),
        ], $ok ? 200 : 503);
    }

    public function metrics(): Response
    {
        $requestCount = (int) Cache::get('metrics:request_count', 0);
        $requestDurationSum = (int) Cache::get('metrics:request_duration_ms_sum', 0);
        $requestDurationCount = (int) Cache::get('metrics:request_duration_ms_count', 0);
        $requestErrors = (int) Cache::get('metrics:request_5xx_count', 0);
        $averageDuration = $requestDurationCount > 0
            ? round($requestDurationSum / $requestDurationCount, 2)
            : 0.0;

        $lines = [
            '# HELP app_requests_total Total HTTP requests.',
            '# TYPE app_requests_total counter',
            "app_requests_total {$requestCount}",
            '# HELP app_request_errors_5xx_total Total 5xx responses.',
            '# TYPE app_request_errors_5xx_total counter',
            "app_request_errors_5xx_total {$requestErrors}",
            '# HELP app_request_duration_ms_sum Total response time in milliseconds.',
            '# TYPE app_request_duration_ms_sum counter',
            "app_request_duration_ms_sum {$requestDurationSum}",
            '# HELP app_request_duration_ms_count Total number of measured responses.',
            '# TYPE app_request_duration_ms_count counter',
            "app_request_duration_ms_count {$requestDurationCount}",
            '# HELP app_request_duration_ms_avg Average response time in milliseconds.',
            '# TYPE app_request_duration_ms_avg gauge',
            "app_request_duration_ms_avg {$averageDuration}",
        ];

        return response(implode("\n", $lines)."\n", 200, [
            'Content-Type' => 'text/plain; version=0.0.4',
        ]);
    }
}
