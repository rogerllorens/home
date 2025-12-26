<?php

namespace App\Services\AI;

class NullAiClient implements AiClientInterface
{
    public function generateVideoSeo(array $input): ?array
    {
        return null;
    }
}
