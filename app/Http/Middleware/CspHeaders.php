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
        $assetSource = $assetCdn ? ["https://{$assetCdn}"] : [];
        $captchaSources = $this->captchaSources();
        $analyticsSources = $this->analyticsSources();
        $adsSources = $this->adsSources();
        $cspConfig = config('candidboys.security.csp', []);

        $imgSources = $this->formatSources(array_merge(
            $assetSource,
            $analyticsSources,
            $adsSources,
            $captchaSources,
            $cspConfig['img'] ?? []
        ));
        $scriptSources = $this->formatSources(array_merge(
            $assetSource,
            $analyticsSources,
            $adsSources,
            $captchaSources,
            $cspConfig['script'] ?? []
        ));
        $styleSources = $this->formatSources(array_merge(
            $assetSource,
            $captchaSources,
            $cspConfig['style'] ?? []
        ));
        $connectSources = $this->formatSources(array_merge(
            $analyticsSources,
            $adsSources,
            $captchaSources,
            $cspConfig['connect'] ?? []
        ));

        $frameDirective = $frameSources === 'none'
            ? "frame-src 'self'{$this->formatSources(array_merge($adsSources, $captchaSources, $cspConfig['frame'] ?? []))}"
            : "frame-src 'self'{$frameSources}{$this->formatSources(array_merge($adsSources, $captchaSources, $cspConfig['frame'] ?? []))}";
        $childDirective = $frameSources === 'none'
            ? "child-src 'self'{$this->formatSources(array_merge($adsSources, $captchaSources, $cspConfig['child'] ?? []))}"
            : "child-src 'self'{$frameSources}{$this->formatSources(array_merge($adsSources, $captchaSources, $cspConfig['child'] ?? []))}";

        $styleUnsafeInline = !empty($cspConfig['allow_unsafe_inline_styles']) ? " 'unsafe-inline'" : '';

        $policy = implode('; ', [
            "default-src 'self'",
            "img-src 'self' data:{$imgSources}",
            "style-src 'self'{$styleUnsafeInline}{$styleSources}",
            "script-src 'self' 'nonce-{$nonce}'{$scriptSources}",
            "connect-src 'self'{$connectSources}",
            $frameDirective,
            $childDirective,
            "frame-ancestors 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "object-src 'none'",
        ]);

        $response->headers->set('Content-Security-Policy', $policy);
        $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        return $response;
    }

    private function captchaSources(): array
    {
        if (!config('candidboys.security.captcha_enabled')) {
            return [];
        }

        return config('candidboys.security.captcha_hosts', []);
    }

    private function analyticsSources(): array
    {
        return config('candidboys.security.analytics_hosts', []);
    }

    private function adsSources(): array
    {
        return config('candidboys.security.ads_hosts', []);
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
            return app()->environment('production') ? 'none' : '';
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

    private function formatSources(array $sources): string
    {
        $matcher = app(EmbedDomainMatcher::class);
        $formatted = [];

        foreach ($sources as $source) {
            $value = trim((string) $source);
            if ($value === '') {
                continue;
            }

            if (str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
                $formatted[] = ' '.$value;
                continue;
            }

            if (str_starts_with($value, '*.')) {
                $normalized = $matcher->normalizeHost($value);
                if ($normalized) {
                    $formatted[] = ' https://'.$normalized;
                }
                continue;
            }

            $normalized = $matcher->normalizeHost($value);
            if ($normalized) {
                $formatted[] = ' https://'.$normalized;
            }
        }

        return implode('', $formatted);
    }
}
