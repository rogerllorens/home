<?php

namespace App\Services\AI;

interface AiClientInterface
{
    public function generateVideoSeo(array $input): ?array;
}
