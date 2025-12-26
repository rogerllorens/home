<?php

return [
    'enabled' => env('AI_ENABLED', true),
    'provider' => env('AI_PROVIDER', 'ollama'),
    'max_requests_per_day' => env('AI_MAX_REQUESTS_PER_DAY', 200),
];
