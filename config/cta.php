<?php

return [
    'priority' => [
        'cams' => [
            'categories' => ['webcam', 'live', 'cams'],
            'tags' => ['cam', 'live', 'webcam'],
        ],
        'dating' => [
            'categories' => ['romantic', 'date', 'dating'],
            'tags' => ['dating', 'romantic', 'date'],
        ],
        'membership' => [
            'min_duration_seconds' => 900,
            'min_quality_score' => 70,
        ],
    ],
    'variants' => [
        'cams' => [
            'A' => [
                'title' => 'Cam en vivo',
                'label' => 'Watch live cams',
                'description' => 'Entra en directo y descubre sesiones en tiempo real.',
            ],
            'B' => [
                'title' => 'Live cams',
                'label' => 'Start live now',
                'description' => 'Explora shows en vivo con acceso inmediato.',
            ],
        ],
        'membership' => [
            'A' => [
                'title' => 'Membresía',
                'label' => 'Watch full scene',
                'description' => 'Acceso completo a escenas largas y sin cortes.',
            ],
            'B' => [
                'title' => 'Full access',
                'label' => 'Unlock full video',
                'description' => 'Desbloquea el contenido completo con una sola suscripción.',
            ],
        ],
        'dating' => [
            'A' => [
                'title' => 'Dating',
                'label' => 'Meet guys',
                'description' => 'Conecta con perfiles reales y empieza a chatear.',
            ],
            'B' => [
                'title' => 'Chat & meet',
                'label' => 'Start meeting',
                'description' => 'Encuentra nuevas conexiones con facilidad.',
            ],
        ],
    ],
    'prelanders' => [
        'enabled' => ['cams', 'dating', 'membership'],
        'copy' => [
            'cams' => [
                'title' => [
                    'en' => 'Live cams',
                    'es' => 'Live cams',
                ],
                'bullets' => [
                    'en' => [
                        'Quick access to live sessions.',
                        'Browse profiles and pick your favorite.',
                        'Available on mobile and desktop.',
                    ],
                    'es' => [
                        'Acceso rápido a transmisiones en directo.',
                        'Explora perfiles y elige tu favorito.',
                        'Disponible en móvil y desktop.',
                    ],
                ],
            ],
            'dating' => [
                'title' => [
                    'en' => 'Meet people online',
                    'es' => 'Conoce gente online',
                ],
                'bullets' => [
                    'en' => [
                        'Create your profile in seconds.',
                        'Discover people with similar interests.',
                        'Start chatting right away.',
                    ],
                    'es' => [
                        'Crea tu perfil en segundos.',
                        'Descubre personas con intereses similares.',
                        'Comienza a chatear al instante.',
                    ],
                ],
            ],
            'membership' => [
                'title' => [
                    'en' => 'Membership access',
                    'es' => 'Acceso de membresía',
                ],
                'bullets' => [
                    'en' => [
                        'Full access to longer scenes.',
                        'Uninterrupted experience.',
                        'Content updated regularly.',
                    ],
                    'es' => [
                        'Acceso completo a escenas largas.',
                        'Experiencia sin interrupciones.',
                        'Contenido actualizado regularmente.',
                    ],
                ],
            ],
        ],
    ],
];
