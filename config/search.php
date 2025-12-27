<?php

return [
    'stopwords' => [
        'en' => ['the', 'and', 'or', 'for', 'with', 'to', 'of', 'in', 'on', 'a', 'an'],
        'es' => ['el', 'la', 'los', 'las', 'y', 'o', 'para', 'con', 'de', 'en', 'un', 'una', 'unos', 'unas'],
    ],
    'synonyms' => [
        'en' => [
            'college' => ['uni', 'university', 'campus'],
            'outdoor' => ['outside', 'nature'],
            'roommates' => ['roommate', 'flatmate'],
            'couple' => ['couples', 'pair'],
            'blond' => ['blonde', 'fair hair'],
            'romantic' => ['sweet', 'tender'],
        ],
        'es' => [
            'universidad' => ['uni', 'universidad', 'campus'],
            'exterior' => ['afuera', 'naturaleza'],
            'pareja' => ['parejas', 'duo'],
            'romantico' => ['romántico', 'romantica', 'romántica', 'romanticos', 'románticos'],
            'masaje' => ['massage'],
        ],
    ],
    'intent_keywords' => [
        'duration' => [
            'short' => ['short', 'quick', 'fast', 'corto', 'rápido', 'rapido'],
            'medium' => ['medium', 'medio', 'mediano'],
            'long' => ['long', 'largo', 'largos'],
        ],
        'sort' => [
            'views' => ['popular', 'top', 'trending', 'tendencias'],
            'recent' => ['new', 'latest', 'nuevo', 'nuevos', 'reciente', 'recientes'],
        ],
        'date' => [
            'week' => ['new', 'latest', 'nuevo', 'nuevos', 'reciente', 'recientes'],
        ],
    ],
    'tag_aliases' => [
        'romantic' => ['romantico', 'romántico', 'romantica', 'romántica', 'romanticos', 'románticos'],
        'massage' => ['masaje'],
        'couples' => ['pareja', 'parejas', 'couple', 'couples'],
    ],
    'category_aliases' => [
        'romantic' => ['romantico', 'romántico', 'romantica', 'romántica', 'romanticos', 'románticos'],
        'first-time' => ['first time', 'primera vez'],
        'massage' => ['masaje', 'massage'],
        'couples' => ['pareja', 'parejas', 'couple', 'couples'],
    ],
    'suggested_queries' => [
        'college roommates',
        'outdoor couple',
        'blond guys',
        'first time',
        'romantic massage',
    ],
];
