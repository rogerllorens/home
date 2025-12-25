<?php

return [
    'categories_controlled' => [
        'real-amateur',
        'couples',
        'first-time',
        'mature-young',
        'romantic',
        'playful',
        'massage',
        'kink-soft',
    ],
    'default_language' => 'es',
    'embed_check' => [
        'timeout_seconds' => 5,
        'max_failures' => 3,
        'retry_delay_seconds' => 3600,
    ],
    'ai' => [
        'provider' => env('AI_PROVIDER', 'ollama'),
        'ollama_host' => env('OLLAMA_HOST', 'http://localhost:11434'),
        'ollama_model' => env('OLLAMA_MODEL', 'llama3'),
        'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
        'openai_base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
        'openai_api_key' => env('OPENAI_API_KEY'),
        'temperature' => env('OPENAI_TEMPERATURE', 0.3),
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
        'utm' => [
            'source' => env('CTA_UTM_SOURCE', 'candidboys'),
            'medium' => env('CTA_UTM_MEDIUM', 'cta'),
            'extra' => (function () {
                $extra = [];
                parse_str((string) env('CTA_UTM_EXTRA', ''), $extra);
                return array_filter($extra);
            })(),
        ],
        'partner_links' => [
            'cams' => [
                'url' => env('PARTNER_CAMS_URL'),
                'label' => env('PARTNER_CTA_CAM_LABEL', 'Watch live'),
                'template' => env('PARTNER_CAMS_TEMPLATE'),
            ],
            'membership' => [
                'url' => env('PARTNER_MEMBERSHIP_URL'),
                'label' => env('PARTNER_CTA_MEMBERSHIP_LABEL', 'Watch full scene'),
                'template' => env('PARTNER_MEMBERSHIP_TEMPLATE'),
            ],
            'dating' => [
                'url' => env('PARTNER_DATING_URL'),
                'label' => env('PARTNER_CTA_DATING_LABEL', 'Meet guys'),
                'template' => env('PARTNER_DATING_TEMPLATE'),
            ],
        ],
    ],
    'security' => [
        'global_iframe_allowlist' => array_values(array_filter(explode(',', (string) env('IFRAME_ALLOWLIST', '')))),
        'asset_cdn' => env('ASSET_CDN_HOST'),
        'captcha_enabled' => env('PUBLIC_CAPTCHA_ENABLED', false),
        'captcha_site_key' => env('CAPTCHA_SITE_KEY'),
        'captcha_secret' => env('CAPTCHA_SECRET_KEY'),
        'captcha_verify_url' => env('CAPTCHA_VERIFY_URL', 'https://www.google.com/recaptcha/api/siteverify'),
        'captcha_hosts' => array_values(array_filter(explode(',', (string) env('CAPTCHA_HOSTS', 'www.google.com,www.gstatic.com')))),
        'analytics_hosts' => array_values(array_filter(explode(',', (string) env('ANALYTICS_HOSTS', '')))),
        'admin_login_captcha_enabled' => env('ADMIN_LOGIN_CAPTCHA_ENABLED', false),
        'admin_login_lockout_max_attempts' => env('ADMIN_LOGIN_LOCKOUT_MAX_ATTEMPTS', 5),
        'admin_login_lockout_minutes' => env('ADMIN_LOGIN_LOCKOUT_MINUTES', 10),
        'csp' => [
            'img' => array_values(array_filter(explode(',', (string) env('CSP_IMG_HOSTS', '')))),
            'script' => array_values(array_filter(explode(',', (string) env('CSP_SCRIPT_HOSTS', '')))),
            'style' => array_values(array_filter(explode(',', (string) env('CSP_STYLE_HOSTS', '')))),
            'connect' => array_values(array_filter(explode(',', (string) env('CSP_CONNECT_HOSTS', '')))),
            'frame' => array_values(array_filter(explode(',', (string) env('CSP_FRAME_HOSTS', '')))),
            'child' => array_values(array_filter(explode(',', (string) env('CSP_CHILD_HOSTS', '')))),
        ],
        'rate_limits' => [
            'search' => '30/min',
            'video' => '60/min',
            'admin_login' => '10/min',
            'admin' => '120/min',
            'public_contact' => '5/min',
            'public_takedown' => '3/min',
            'video_events' => '60/min',
        ],
    ],
];
