<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;

class PublicCache
{
    private const VERSION_KEY = 'public_cache_version';

    public static function version(): int
    {
        return (int) Cache::get(self::VERSION_KEY, 1);
    }

    public static function key(string $suffix): string
    {
        return 'public:'.self::version().':'.$suffix;
    }

    public static function bust(): void
    {
        $current = self::version();
        Cache::forever(self::VERSION_KEY, $current + 1);
    }
}
