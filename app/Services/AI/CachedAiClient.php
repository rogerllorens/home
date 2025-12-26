<?php

namespace App\Services\AI;

use App\Models\AiGeneration;

class CachedAiClient implements AiClientInterface
{
    public function __construct(
        private readonly AiClientInterface $client,
        private readonly AiUsageLimiter $limiter
    ) {
    }

    public function generateVideoSeo(array $input): ?array
    {
        if (!$this->aiEnabled()) {
            return null;
        }

        $hash = $this->hashInput($input);
        $cached = AiGeneration::query()
            ->where('type', 'video_seo')
            ->where('input_hash', $hash)
            ->first();

        if ($cached) {
            $decoded = json_decode($cached->output_text, true);
            return is_array($decoded) ? $decoded : null;
        }

        if (!$this->limiter->incrementIfAvailable()) {
            return null;
        }

        $result = $this->client->generateVideoSeo($input);
        if (!$result) {
            return null;
        }

        AiGeneration::create([
            'type' => 'video_seo',
            'input_hash' => $hash,
            'output_text' => json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);

        return $result;
    }

    private function hashInput(array $input): string
    {
        return hash('sha256', json_encode($input, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    private function aiEnabled(): bool
    {
        return (bool) config('ai.enabled', true) && config('ai.provider', 'none') !== 'none';
    }
}
