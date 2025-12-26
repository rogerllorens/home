<?php

namespace App\Services\AI;

class AiClientFactory
{
    public function make(): AiClientInterface
    {
        if (!(bool) config('ai.enabled', true) || config('ai.provider', 'none') === 'none') {
            return app(NullAiClient::class);
        }

        $client = match (config('ai.provider', config('candidboys.ai.provider'))) {
            'openai' => app(OpenAiClient::class),
            'ollama' => app(OllamaAiClient::class),
            default => app(OllamaAiClient::class),
        };

        return new CachedAiClient($client, app(AiUsageLimiter::class));
    }
}
