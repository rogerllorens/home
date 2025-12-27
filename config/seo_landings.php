<?php

return [
    'min_videos' => 8,
    'durations' => [
        'short' => [
            'label' => 'cortos',
            'min' => 0,
            'max' => (int) config('videos.short_max_minutes', 8) * 60,
        ],
        'long' => [
            'label' => 'largos',
            'min' => (int) config('videos.long_min_minutes', 20) * 60,
            'max' => null,
        ],
    ],
    'timeframes' => [
        'this-week' => [
            'label' => 'esta semana',
            'days' => 7,
        ],
        'this-month' => [
            'label' => 'este mes',
            'days' => 30,
        ],
    ],
    'faq_templates' => [
        [
            'question' => '¿Qué tipo de videos incluye esta landing de {category}?',
            'answer' => 'Agrupamos videos {duration} sobre {category} y {tag} para que descubras contenido relevante rápidamente.',
        ],
        [
            'question' => '¿Con qué frecuencia se actualiza?',
            'answer' => 'El listado se actualiza automáticamente con nuevas publicaciones {timeframe}.',
        ],
        [
            'question' => '¿Cómo navegar más temas?',
            'answer' => 'Explora categorías y tags relacionados para encontrar más videos similares a {category}.',
        ],
    ],
];
