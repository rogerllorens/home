<?php

namespace App\Http\Middleware;

use App\Support\DeviceHash;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDeviceHash
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($request->hasCookie(DeviceHash::cookieName())) {
            return $response;
        }

        $deviceHash = DeviceHash::ensure($request);
        $secure = (bool) config('session.secure', false);
        $sameSite = config('session.same_site', 'Lax') ?? 'Lax';

        return $response->withCookie(cookie(
            DeviceHash::cookieName(),
            $deviceHash,
            60 * 24 * 365,
            null,
            null,
            $secure,
            true,
            false,
            $sameSite
        ));
    }
}
