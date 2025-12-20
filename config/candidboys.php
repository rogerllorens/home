<?php

return [
    'categories_controlled' => [
        // TODO: Populate with the exact list from SPEC.md.
    ],
    'default_language' => 'es',
    'embed_check' => [
        'timeout_seconds' => 5,
        'max_failures' => 3,
        'retry_delay_seconds' => 3600,
    ],
    'ai' => [
        'ollama_host' => env('OLLAMA_HOST', 'http://localhost:11434'),
        'ollama_model' => env('OLLAMA_MODEL', 'llama3'),
        'timeout_seconds' => 60,
        'retries' => 2,
        'backoff_seconds' => [2, 5],
    ],
    'seo' => [
        'title_min' => 45,
        'title_max' => 70,
        'desc_min' => 140,
        'desc_max' => 300,
        'tags_min' => 8,
        'tags_max' => 16,
        'quality_min' => 55,
    ],
    'monetization' => [
        'cta_templates' => [
            'default' => 'Descubre más contenido y ofertas exclusivas.',
        ],
        'partner_links' => [
            'cams' => [
                'url' => env('PARTNER_CAMS_URL'),
                'template' => env('PARTNER_CAMS_TEMPLATE'),
            ],
            'membership' => [
                'url' => env('PARTNER_MEMBERSHIP_URL'),
                'template' => env('PARTNER_MEMBERSHIP_TEMPLATE'),
            ],
            'dating' => [
                'url' => env('PARTNER_DATING_URL'),
                'template' => env('PARTNER_DATING_TEMPLATE'),
            ],
        ],
    ],
    'security' => [
        'global_iframe_allowlist' => [],
        'rate_limits' => [
            'search' => '30/min',
            'video' => '60/min',
            'admin_login' => '10/min',
        ],
    ],
];
