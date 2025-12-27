<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Cta;
use App\Models\CtaClick;
use App\Models\Video;
use App\Services\Monetization\CtaResolver;
use App\Support\DeviceHash;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class CtaRedirectController extends Controller
{
    public function __invoke(Request $request, Cta $cta, CtaResolver $resolver): RedirectResponse
    {
        $videoId = $request->integer('video');
        $video = $videoId ? Video::find($videoId) : null;
        if ($videoId && !$video) {
            abort(404);
        }

        try {
            $destination = $video
                ? $resolver->destination($video, $cta->key)
                : $resolver->defaultDestinationForCta($cta);
        } catch (\Throwable $exception) {
            Log::warning('CTA destination unavailable', [
                'cta_id' => $cta->id,
                'cta_key' => $cta->key,
                'video_id' => $video?->id,
                'error' => $exception->getMessage(),
            ]);
            abort(500);
        }

        if (!$destination) {
            abort(404);
        }

        $clickId = (string) Str::uuid();
        $placement = $request->string('placement')->toString() ?: null;
        $variant = $request->string('variant')->toString() ?: null;
        $landingType = $request->string('landing_type')->toString() ?: 'direct';
        $originPage = $request->string('origin')->toString() ?: null;
        $referrer = $request->headers->get('referer');
        $pageUrl = $request->string('page_url')->toString() ?: null;
        $deviceHash = DeviceHash::fromRequest($request);
        $hashSalt = (string) config('app.key', 'candidboys');

        $ipHash = $request->ip() ? hash_hmac('sha256', $request->ip(), $hashSalt) : null;
        $userAgent = $request->userAgent() ?: '';
        $userAgentHash = $userAgent !== '' ? hash_hmac('sha256', $userAgent, $hashSalt) : null;

        $redirectUrl = $this->withUtm($destination, [
            'utm_source' => config('candidboys.monetization.utm.source', 'candidboys'),
            'utm_medium' => config('candidboys.monetization.utm.medium', 'cta'),
            'utm_campaign' => $cta->key,
            'click_id' => $clickId,
            ...config('candidboys.monetization.utm.extra', []),
        ]);

        try {
            CtaClick::create([
                'cta_id' => $cta->id,
                'video_id' => $video?->id,
                'cta_key' => $cta->key,
                'placement' => $placement,
                'cta_variant' => $variant,
                'landing_type' => $landingType,
                'origin_page' => $originPage,
                'page_url' => $pageUrl,
                'device_hash' => $deviceHash,
                'category_slug' => $video?->category_slug,
                'referrer' => $referrer,
                'ip_hash' => $ipHash,
                'user_agent_hash' => $userAgentHash,
                'click_id' => $clickId,
                'destination_url' => $destination,
            ]);
        } catch (\Throwable $exception) {
            Log::warning('CTA click tracking failed', [
                'cta_id' => $cta->id,
                'cta_key' => $cta->key,
                'video_id' => $video?->id,
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
