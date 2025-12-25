<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\CtaClick;
use App\Models\Video;
use App\Services\Monetization\CtaResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CtaTrackingController extends Controller
{
    public function __invoke(Request $request, Video $video, string $ctaKey, CtaResolver $resolver): RedirectResponse
    {
        $destination = $resolver->destination($video, $ctaKey);

        if (!$destination) {
            abort(404);
        }

        $clickId = (string) Str::uuid();
        $placement = $request->string('placement')->toString() ?: 'video_detail';
        $referrer = $request->headers->get('referer');
        $hashSalt = (string) config('app.key', 'candidboys');

        $ipHash = $request->ip() ? hash_hmac('sha256', $request->ip(), $hashSalt) : null;
        $userAgent = $request->userAgent() ?: '';
        $userAgentHash = $userAgent !== '' ? hash_hmac('sha256', $userAgent, $hashSalt) : null;

        $redirectUrl = $this->withUtm($destination, [
            'utm_source' => config('candidboys.monetization.utm.source', 'candidboys'),
            'utm_medium' => config('candidboys.monetization.utm.medium', 'cta'),
            'utm_campaign' => $ctaKey,
            'click_id' => $clickId,
            ...config('candidboys.monetization.utm.extra', []),
        ]);

        try {
            CtaClick::create([
                'video_id' => $video->id,
                'cta_key' => $ctaKey,
                'placement' => $placement,
                'category_slug' => $video->category_slug,
                'referrer' => $referrer,
                'ip_hash' => $ipHash,
                'user_agent_hash' => $userAgentHash,
                'click_id' => $clickId,
                'destination_url' => $destination,
            ]);
        } catch (\Throwable $exception) {
            Log::warning('CTA click tracking failed', [
                'video_id' => $video->id,
                'cta_key' => $ctaKey,
                'error' => $exception->getMessage(),
            ]);
        }

        return redirect()->away($redirectUrl, 302);
    }

    private function withUtm(string $destination, array $params): string
    {
        $parsed = parse_url($destination);
        $query = [];
        if (!empty($parsed['query'])) {
            parse_str($parsed['query'], $query);
        }

        foreach (array_filter($params) as $key => $value) {
            if (!array_key_exists($key, $query) || $query[$key] === '') {
                $query[$key] = $value;
            }
        }
        $queryString = http_build_query($query);

        $scheme = $parsed['scheme'] ?? 'https';
        $host = $parsed['host'] ?? '';
        $path = $parsed['path'] ?? '';
        $fragment = isset($parsed['fragment']) ? '#'.$parsed['fragment'] : '';
        $port = isset($parsed['port']) ? ':'.$parsed['port'] : '';

        return "{$scheme}://{$host}{$port}{$path}?{$queryString}{$fragment}";
    }
}
