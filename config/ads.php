<?php

return [
    'enabled' => env('ADS_ENABLED', false),
    'provider' => env('ADS_PROVIDER_NAME'),
    'slots' => [
        'home_top' => [
            'enabled' => false,
            'type' => 'html_snippet',
            'html' => '<!-- AD PROVIDER CODE HERE -->',
        ],
        'home_between_sections' => [
            'enabled' => false,
            'type' => 'html_snippet',
            'html' => '<!-- AD PROVIDER CODE HERE -->',
        ],
        'video_top' => [
            'enabled' => false,
            'type' => 'html_snippet',
            'html' => '<!-- AD PROVIDER CODE HERE -->',
        ],
        'video_sidebar' => [
            'enabled' => false,
            'type' => 'html_snippet',
            'html' => '<!-- AD PROVIDER CODE HERE -->',
        ],
    ],
];
