<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Cache;

class AiUsageLimiter
{
    public function incrementIfAvailable(): bool
    {
        $limit = (int) config('ai.max_requests_per_day', 200);
        if ($limit <= 0) {
            return false;
        }

        $key = $this->keyForToday();
        $current = (int) Cache::get($key, 0);
        if ($current >= $limit) {
            return false;
        }

        Cache::increment($key);
        Cache::put($key, (int) Cache::get($key, 0), now()->addDays(2));

        return ((int) Cache::get($key, 0)) <= $limit;
    }

    public function canRequest(): bool
    {
        $limit = (int) config('ai.max_requests_per_day', 200);
        if ($limit <= 0) {
            return false;
        }

        return (int) Cache::get($this->keyForToday(), 0) < $limit;
    }

    private function keyForToday(): string
    {
        return 'ai:usage:'.now()->toDateString();
    }
}
