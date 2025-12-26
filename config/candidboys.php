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
        'og_image' => env('SEO_OG_IMAGE'),
        'og_type' => env('SEO_OG_TYPE', 'website'),
        'twitter_card' => env('SEO_TWITTER_CARD', 'summary_large_image'),
        'robots' => env('SEO_ROBOTS', 'index,follow'),
    ],
    'analytics' => [
        'provider' => env('ANALYTICS_PROVIDER', 'none'),
        'plausible_domain' => env('PLAUSIBLE_DOMAIN'),
        'ga_measurement_id' => env('GA_MEASUREMENT_ID'),
    ],
    'ui' => [
        'show_adult_warning' => env('SHOW_ADULT_WARNING', false),
        'adult_warning_text' => env('ADULT_WARNING_TEXT', 'Adult content. 18+ only.'),
        'affiliate_notice_text' => env('AFFILIATE_NOTICE_TEXT', 'Some links on this site are affiliate links and may generate commissions.'),
        'cookie_banner_enabled' => env('COOKIE_BANNER_ENABLED', false),
        'cookie_banner_cookie' => env('COOKIE_BANNER_COOKIE', 'cookie_consent'),
        'cookie_notice_text' => env('COOKIE_NOTICE_TEXT', 'Usamos cookies y analítica básica para mejorar la experiencia. Puedes aceptar para continuar.'),
        'cookie_ads_notice_text' => env('COOKIE_ADS_NOTICE_TEXT', 'Este sitio puede incluir contenido patrocinado o anuncios.'),
    ],
    'articles' => [
        [
            'slug' => 'how-affiliate-links-work',
            'title' => 'How affiliate links work on this site',
            'summary' => 'A short overview of how affiliate links support Candid Boys.',
            'sections' => [
                [
                    'title' => 'What affiliate links are',
                    'body' => 'Algunos enlaces nos permiten recibir una comisión si decides visitar un partner. No cambia tu experiencia en el sitio.',
                ],
                [
                    'title' => 'Why we use them',
                    'body' => 'Nos ayudan a mantener el sitio y a seguir curando contenido de forma sostenible.',
                ],
            ],
        ],
        [
            'slug' => 'how-content-removal-works',
            'title' => 'How we handle content removal requests',
            'summary' => 'Información general sobre el proceso de retirada de contenidos.',
            'sections' => [
                [
                    'title' => 'Requesting removal',
                    'body' => 'Puedes reportar contenido mediante el formulario de takedown o el email indicado.',
                ],
                [
                    'title' => 'Review process',
                    'body' => 'Revisamos cada solicitud y respondemos con pasos claros y tiempos estimados.',
                ],
            ],
        ],
        [
            'slug' => 'privacy-basics',
            'title' => 'Basic privacy tips for adult content viewers',
            'summary' => 'Consejos generales para navegar de forma más privada y segura.',
            'sections' => [
                [
                    'title' => 'Use trusted devices',
                    'body' => 'Prioriza dispositivos personales y revisa permisos antes de compartir.',
                ],
                [
                    'title' => 'Stay aware of shared access',
                    'body' => 'Cierra sesión y limpia el historial si usas un equipo compartido.',
                ],
            ],
        ],
    ],
    'taxonomy_intros' => [
        'categories' => [
            'couples' => 'Momentos reales en pareja con química natural y miradas cómplices. El ritmo es cercano y sin poses. Ideal para disfrutar con calma.',
            'first-time' => 'Primeras veces auténticas con nervios, risas y curiosidad. La energía es espontánea y cercana. Pensado para quienes buscan frescura.',
            'romantic' => 'Romance y conexión en escenas suaves y atmosféricas. El enfoque es íntimo y emocional. Perfecto para un mood relajado.',
            'playful' => 'Energía juguetona con risas y complicidad. Clips dinámicos y ligeros que mantienen el ritmo. Una selección para ver sin prisa.',
            'massage' => 'Masajes sensuales con un ritmo lento y cálido. Ambientes relajados y enfoque en la conexión. Ideal para una experiencia tranquila.',
        ],
        'tags' => [
            'amateur' => 'Escenas espontáneas y cercanas con un aire real desde el primer minuto. Tono natural y sin artificios.',
            'romantic' => 'Momentos de conexión y ternura, perfectos para ver sin prisas. Ritmo suave y cercano.',
            'massage' => 'Relajación y sensualidad en videos pausados y envolventes. Ambiente cálido y tranquilo.',
            'playful' => 'Clips ligeros y divertidos con energía positiva. Dinámica ágil y cercana.',
        ],
    ],
    'monetization' => [
        'cta_templates' => [
            'default' => 'Descubre más contenido y ofertas exclusivas.',
        ],
        'cta_variants' => [
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
        'cta_priority' => [
            'cams' => [
                'categories' => ['webcam', 'live', 'cams'],
                'tags' => ['cam', 'live', 'webcam'],
            ],
            'dating' => [
                'categories' => ['romantic', 'casual', 'dating'],
                'tags' => ['dating', 'romantic', 'date'],
            ],
            'membership' => [
                'min_duration_seconds' => 900,
                'min_quality_score' => 70,
            ],
        ],
        'prelanders' => [
            'enabled' => ['cams', 'dating', 'membership'],
            'copy' => [
                'cams' => [
                    'title' => 'Live cams',
                    'bullets' => [
                        'Acceso rápido a transmisiones en directo.',
                        'Explora perfiles y elige tu favorito.',
                        'Disponible en móvil y desktop.',
                    ],
                ],
                'dating' => [
                    'title' => 'Dating',
                    'bullets' => [
                        'Crea tu perfil en segundos.',
                        'Descubre personas con intereses similares.',
                        'Comienza a chatear al instante.',
                    ],
                ],
                'membership' => [
                    'title' => 'Membership',
                    'bullets' => [
                        'Acceso completo a escenas largas.',
                        'Experiencia sin interrupciones.',
                        'Contenido actualizado regularmente.',
                    ],
                ],
            ],
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
        'ads_hosts' => array_values(array_filter(explode(',', (string) env('ADS_HOSTS', '')))),
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
