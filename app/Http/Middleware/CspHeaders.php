<?php

namespace App\Http\Middleware;

use App\Models\Video;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Symfony\Component\HttpFoundation\Response;

class CspHeaders
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $frameSources = $this->resolveFrameSources($request);

        $policy = implode('; ', [
            "default-src 'self'",
            "img-src 'self' https: data:",
            "style-src 'self' 'unsafe-inline'",
            "script-src 'self'",
            "frame-src 'self'{$frameSources}",
        ]);

        $response->headers->set('Content-Security-Policy', $policy);
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        return $response;
    }

    private function resolveFrameSources(Request $request): string
    {
        $allowlist = config('candidboys.security.global_iframe_allowlist', []);

        if ($request->route()?->getName() === 'public.video') {
            $videoId = $request->route('id');
            $video = $videoId ? Video::with('source')->find($videoId) : null;
            $sourceAllow = $video?->source?->settings['allow_iframe_domains'] ?? [];
            $allowlist = array_merge($allowlist, Arr::wrap($sourceAllow));
        }

        $allowlist = array_values(array_unique(array_filter($allowlist)));
        if (empty($allowlist)) {
            return '';
        }

        $sources = array_map(function ($domain) {
            return ' https://'.ltrim($domain, '.');
        }, $allowlist);

        return implode('', $sources);
    }
}
