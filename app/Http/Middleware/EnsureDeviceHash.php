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

        return $response->withCookie(cookie(
            DeviceHash::cookieName(),
            $deviceHash,
            60 * 24 * 365,
            null,
            null,
            false,
            true,
            false,
            'Lax'
        ));
    }
}
