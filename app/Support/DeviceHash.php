<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DeviceHash
{
    public static function fromRequest(Request $request): ?string
    {
        return $request->cookie(self::cookieName());
    }

    public static function ensure(Request $request): string
    {
        $existing = self::fromRequest($request);
        if ($existing) {
            return $existing;
        }

        return hash('sha256', (string) Str::uuid());
    }

    public static function cookieName(): string
    {
        return 'device_id';
    }
}
