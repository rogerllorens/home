<?php

namespace App\Services\AI;

class AiClientFactory
{
    public function make(): AiClientInterface
    {
        return match (config('candidboys.ai.provider')) {
            'openai' => app(OpenAiClient::class),
            'ollama' => app(OllamaAiClient::class),
            default => app(OllamaAiClient::class),
        };
    }
}
