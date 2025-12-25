<?php

return [
    'dsn' => env('SENTRY_ENABLED', env('APP_ENV', 'production') === 'production')
        ? env('SENTRY_LARAVEL_DSN')
        : null,
    'environment' => env('SENTRY_ENVIRONMENT', env('APP_ENV', 'production')),
    'traces_sample_rate' => (float) env('SENTRY_TRACES_SAMPLE_RATE', 0.0),
    'send_default_pii' => false,
];
