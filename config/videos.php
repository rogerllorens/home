<?php

return [
    'short_max_minutes' => env('SHORT_VIDEO_MAX_MINUTES', 8),
    'long_min_minutes' => env('LONG_VIDEO_MIN_MINUTES', 20),
    'view_rate_limit_minutes' => env('VIDEO_VIEW_RATE_LIMIT_MINUTES', 30),
    'view_retention_days' => env('VIDEO_VIEW_RETENTION_DAYS', 90),
    'continue_watching_limit' => env('CONTINUE_WATCHING_LIMIT', 10),
    'recommendation_history_limit' => env('RECOMMENDATION_HISTORY_LIMIT', 100),
    'recommendation_limit' => env('RECOMMENDATION_LIMIT', 16),
];
