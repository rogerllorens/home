<?php

namespace App\Services\Analytics;

use App\Models\AnalyticsEvent;
use App\Support\DeviceHash;
use Illuminate\Http\Request;

class TrackingService
{
    public function track(string $eventName, array $properties = [], ?Request $request = null): AnalyticsEvent
    {
        $request = $request ?? request();

        $hashSalt = (string) config('app.key', 'candidboys');
        $ipHash = $request?->ip() ? hash_hmac('sha256', (string) $request->ip(), $hashSalt) : null;
        $userAgent = $request?->userAgent() ?: '';
        $userAgentHash = $userAgent !== '' ? hash_hmac('sha256', $userAgent, $hashSalt) : null;
        $deviceHash = $request ? DeviceHash::fromRequest($request) : null;

        return AnalyticsEvent::create([
            'event_name' => $eventName,
            'properties' => $properties,
            'device_hash' => $deviceHash,
            'locale' => $request?->route('locale') ?? $request?->getLocale(),
            'path' => $request?->path(),
            'referrer' => $request?->headers->get('referer'),
            'ip_hash' => $ipHash,
            'user_agent_hash' => $userAgentHash,
            'occurred_at' => now(),
        ]);
    }
}
