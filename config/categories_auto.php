<?php

return [
    'min_hits_for_candidate' => env('CATEGORY_CANDIDATE_MIN_HITS', 40),
    'min_videos_for_candidate' => env('CATEGORY_CANDIDATE_MIN_VIDEOS', 8),
    'lookback_days' => env('CATEGORY_CANDIDATE_LOOKBACK_DAYS', 30),
    'auto_approve' => env('CATEGORY_CANDIDATE_AUTO_APPROVE', false),
    'min_hits_for_auto_approve' => env('CATEGORY_CANDIDATE_MIN_HITS_AUTO', 120),
    'min_videos_for_auto_approve' => env('CATEGORY_CANDIDATE_MIN_VIDEOS_AUTO', 30),
    'max_videos_per_category' => env('CATEGORY_CANDIDATE_MAX_VIDEOS', 200),
    'min_views_per_month_for_keep' => env('CATEGORY_AUTO_MIN_VIEWS_KEEP', 10),
    'min_videos_for_keep' => env('CATEGORY_AUTO_MIN_VIDEOS_KEEP', 8),
    'banned_terms' => [
        'incest',
        'underage',
        'teen',
        'rape',
        'bestiality',
        'forced',
    ],
];
