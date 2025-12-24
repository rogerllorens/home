<?php

namespace App\Http\Middleware;

use App\Models\Video;
use App\Services\Embeds\EmbedDomainMatcher;
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
        $nonce = base64_encode(random_bytes(16));
        $request->attributes->set('csp_nonce', $nonce);
        view()->share('cspNonce', $nonce);

        $response = $next($request);

        $frameSources = $this->resolveFrameSources($request);
        $assetCdn = config('candidboys.security.asset_cdn');
        $assetSource = $assetCdn ? " https://{$assetCdn}" : '';

        $policy = implode('; ', [
            "default-src 'self'",
            "img-src 'self' https: data:{$assetSource}",
            "style-src 'self' 'unsafe-inline'",
            "script-src 'self' 'nonce-{$nonce}'",
            "frame-src 'self'{$frameSources}",
            "child-src 'self'{$frameSources}",
            "frame-ancestors 'self'",
        ]);

        $response->headers->set('Content-Security-Policy', $policy);
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        return $response;
    }

    private function resolveFrameSources(Request $request): string
    {
        $matcher = app(EmbedDomainMatcher::class);
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

        $sources = array_map(function ($domain) use ($matcher) {
            $value = trim((string) $domain);
            if ($value === '') {
                return null;
            }

            if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
                return ' '.$value;
            }

            if (str_starts_with($value, '*.')) {
                $normalized = $matcher->normalizeHost($value);
                return $normalized ? ' https://'.$normalized : null;
            }

            $normalized = $matcher->normalizeHost($value);
            return $normalized ? ' https://'.$normalized : null;
        }, $allowlist);

        $sources = array_values(array_filter($sources));

        return implode('', $sources);
    }
}
