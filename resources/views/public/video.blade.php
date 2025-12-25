@php
    $thumbnail = $video->thumbnail_url ?: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1280&q=80';
    $tags = array_slice($video->raw_tags ?? [], 0, 12);
    $publishedAt = $video->published_at ?? $video->created_at;
    $timeAgo = $publishedAt ? time_ago($publishedAt) : '';
    $viewsTotal = $video->display_views;
    $formattedViews = $viewsTotal ? format_views($viewsTotal) : null;
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit(($video->seo_title ?: $video->title) . ' | Candid Boys', $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit($video->seo_description ?: strip_tags($video->description ?? ''), $descMax, '');
    $durationLabel = null;
    if ($video->duration_seconds) {
        $durationLabel = $video->duration_seconds >= 3600
            ? gmdate('H:i:s', $video->duration_seconds)
            : gmdate('i:s', $video->duration_seconds);
    }
    $durationIso = null;
    if ($video->duration_seconds) {
        $hours = intdiv($video->duration_seconds, 3600);
        $minutes = intdiv($video->duration_seconds % 3600, 60);
        $seconds = $video->duration_seconds % 60;
        $durationIso = 'PT';
        if ($hours > 0) {
            $durationIso .= $hours . 'H';
        }
        if ($minutes > 0) {
            $durationIso .= $minutes . 'M';
        }
        if ($seconds > 0 || $durationIso === 'PT') {
            $durationIso .= $seconds . 'S';
        }
    }
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]) }}"
            robots="{{ $robots }}"
            og-image="{{ $thumbnail }}"
        />
        <meta property="og:title" content="{{ $video->seo_title ?: $video->title }}">
        <meta property="og:description" content="{{ $pageDescription }}">
        <meta property="og:type" content="video.other">
        <meta property="og:url" content="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]) }}">
        <script type="application/ld+json" nonce="{{ $cspNonce ?? '' }}">
            {!! json_encode(array_filter([
                '@context' => 'https://schema.org',
                '@type' => 'BreadcrumbList',
                'itemListElement' => array_values(array_filter([
                    [
                        '@type' => 'ListItem',
                        'position' => 1,
                        'name' => 'Home',
                        'item' => url('/'),
                    ],
                    $video->category_slug ? [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => \Illuminate\Support\Str::headline($video->category_slug),
                        'item' => route('public.category', $video->category_slug),
                    ] : null,
                    [
                        '@type' => 'ListItem',
                        'position' => $video->category_slug ? 3 : 2,
                        'name' => $video->seo_title ?: $video->title,
                        'item' => route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]),
                    ],
                ])),
            ]), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
        </script>
        <script type="application/ld+json" nonce="{{ $cspNonce ?? '' }}">
            {!! json_encode(array_filter([
                '@context' => 'https://schema.org',
                '@type' => 'VideoObject',
                'name' => $video->seo_title ?: $video->title,
                'description' => $video->seo_description ?: strip_tags($video->description ?? ''),
                'thumbnailUrl' => [$thumbnail],
                'datePublished' => optional($video->published_at)->toIso8601String(),
                'duration' => $durationIso,
                'embedUrl' => $video->embed_url,
                'url' => route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]),
                'interactionStatistic' => $viewsTotal ? [
                    '@type' => 'InteractionCounter',
                    'interactionType' => 'https://schema.org/WatchAction',
                    'userInteractionCount' => $viewsTotal,
                ] : null,
            ]), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
        </script>
    @endpush

    <section class="grid gap-8 lg:grid-cols-3">
        <div class="lg:col-span-2">
            <nav class="mb-3 text-xs text-slate-400">
                <a class="hover:text-slate-200" href="{{ route('public.home') }}">Home</a>
                @if ($video->category_slug)
                    <span>›</span>
                    <a class="hover:text-slate-200" href="{{ route('public.category', $video->category_slug) }}">
                        {{ \Illuminate\Support\Str::headline($video->category_slug) }}
                    </a>
                @endif
                <span>›</span>
                <span class="text-slate-200">{{ $video->title }}</span>
            </nav>
            <h1 class="text-2xl font-semibold text-white">{{ $video->title }}</h1>
            <div class="mt-4 rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                    <span class="font-semibold">Detalles</span>
                    @if ($durationLabel)
                        <span class="rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">{{ $durationLabel }}</span>
                    @endif
                    @if ($formattedViews)
                        <span>• {{ $formattedViews }} views</span>
                    @endif
                    @if ($timeAgo)
                        <span>• {{ $timeAgo }}</span>
                    @endif
                </div>
                <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    @if ($video->category_slug)
                        <a class="rounded-full border border-red-500/50 px-3 py-1 font-semibold text-red-100" href="{{ route('public.category', $video->category_slug) }}">
                            {{ \Illuminate\Support\Str::headline($video->category_slug) }}
                        </a>
                    @endif
                    @foreach ($tags as $tag)
                        <a class="rounded-full bg-white/5 px-3 py-1 text-slate-200 hover:bg-white/10" href="{{ route('public.tag', $tag) }}">
                            #{{ $tag }}
                        </a>
                    @endforeach
                    @if (empty($tags))
                        <span class="text-slate-400">Sin tags.</span>
                    @endif
                </div>
                <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                    <span>Categoría: {{ $video->category_slug ? \Illuminate\Support\Str::headline($video->category_slug) : 'N/A' }}</span>
                    <span>Publicado: {{ $video->published_at?->format('d/m/Y') ?? '-' }}</span>
                </div>
            </div>

            <div class="mt-6 space-y-4">
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <button
                        class="rounded-md bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10"
                        type="button"
                        data-copy-url="{{ request()->fullUrl() }}"
                    >
                        Copiar enlace
                    </button>
                    <a class="rounded-md bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10" href="mailto:?subject={{ urlencode($video->title) }}&body={{ urlencode(request()->fullUrl()) }}">
                        Compartir por email
                    </a>
                </div>
                @if ($isUnavailable)
                    <div class="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                        Video unavailable.
                    </div>
                @endif
                <div class="overflow-hidden rounded-md border border-red-600/30 bg-black">
                    @php
                        $iframeSandbox = $video->source?->settings['iframe_sandbox'] ?? 'allow-scripts allow-same-origin allow-presentation';
                        $iframeAllow = $video->source?->settings['iframe_allow'] ?? 'fullscreen; picture-in-picture';
                    @endphp
                    @if (!$isUnavailable && $embedUrl)
                        <div class="relative aspect-video" id="embed-container" data-embed-container>
                            <img src="{{ $thumbnail }}" alt="{{ $video->title }}" class="h-full w-full object-cover" loading="lazy" decoding="async" width="1280" height="720">
                            <button
                                class="absolute inset-0 flex items-center justify-center bg-black/60 text-white"
                                type="button"
                                data-embed-url="{{ $embedUrl }}"
                                data-embed-container="#embed-container"
                                data-iframe-sandbox="{{ $iframeSandbox }}"
                                data-iframe-allow="{{ $iframeAllow }}"
                            >
                                <span class="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold">Play</span>
                            </button>
                        </div>
                    @elseif (!$isUnavailable && $sanitizedEmbed)
                        <div class="aspect-video">{!! $sanitizedEmbed !!}</div>
                    @else
                        <div class="flex aspect-video items-center justify-center text-sm text-slate-400">Embed no disponible.</div>
                    @endif
                </div>

                @if ($ctas)
                    <div class="rounded-md border border-red-500/30 bg-red-500/10 p-4">
                        <p class="text-xs uppercase tracking-wide text-red-200">Ofertas destacadas</p>
                        <h2 class="mt-2 text-lg font-semibold text-white">Accede a más contenido</h2>
                        <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        @foreach ($ctas as $cta)
                                <div class="rounded-md border border-white/10 bg-white/5 p-4">
                                    <p class="text-xs uppercase text-slate-400">{{ $cta['label'] }}</p>
                                    <h3 class="mt-2 text-base font-semibold text-white">{{ $cta['title'] }}</h3>
                                    <p class="mt-2 text-sm text-slate-300">{{ $cta['description'] }}</p>
                                    <a class="mt-4 inline-flex rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500" href="{{ $cta['track_url'] }}" target="_blank" rel="sponsored noopener">
                                        Ver oferta
                                    </a>
                                </div>
                        @endforeach
                        </div>
                    </div>
                @endif

                <div class="flex flex-wrap items-center gap-3 text-sm">
                    @if ($video->category_slug)
                        <a class="rounded-md bg-white/5 px-3 py-2 font-semibold text-slate-100 hover:bg-white/10" href="{{ route('public.category', $video->category_slug) }}">
                            Volver a {{ \Illuminate\Support\Str::headline($video->category_slug) }}
                        </a>
                    @endif
                    @if ($nextVideo)
                        <a class="rounded-md border border-red-500/60 px-3 py-2 font-semibold text-red-100 hover:border-red-400" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($nextVideo->seo_title ?: $nextVideo->title), 'id' => $nextVideo->id]) }}">
                            Next video
                        </a>
                    @endif
                    @if ($shuffleVideo)
                        <a class="rounded-md bg-white/5 px-3 py-2 font-semibold text-slate-100 hover:bg-white/10" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($shuffleVideo->seo_title ?: $shuffleVideo->title), 'id' => $shuffleVideo->id]) }}">
                            Shuffle
                        </a>
                    @endif
                </div>

                @if ($video->description)
                    <p class="text-sm text-slate-300">{{ $video->description }}</p>
                @endif
            </div>
        </div>

        <aside class="space-y-4">
            <div class="rounded-md border border-white/10 bg-white/5 p-4">
                <h2 class="text-sm font-semibold text-white">Detalles</h2>
                <div class="mt-3 space-y-2 text-xs text-slate-400">
                    <p>Estado: {{ $video->status->value }}</p>
                    <p>Categoría: {{ $video->category_slug ? \Illuminate\Support\Str::headline($video->category_slug) : 'N/A' }}</p>
                    <p>Publicado: {{ $video->published_at?->format('d/m/Y') ?? '-' }}</p>
                </div>
            </div>
            @if ($ctas)
                <div class="rounded-md border border-white/10 bg-white/5 p-4">
                    <h2 class="text-sm font-semibold text-white">Ofertas destacadas</h2>
                    <div class="mt-3 space-y-2 text-sm text-slate-300">
                        @foreach ($ctas as $cta)
                            <a class="block rounded-md bg-red-600/20 px-3 py-2 text-red-100 hover:bg-red-600/30" href="{{ $cta['track_url'] }}" target="_blank" rel="sponsored noopener">
                                {{ $cta['title'] }}
                            </a>
                        @endforeach
                    </div>
                </div>
            @endif
        </aside>
    </section>

    <section class="mt-10">
        <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">Related videos</h2>
        </div>
        @if ($ctas)
            <div class="mb-6 rounded-md border border-white/10 bg-white/5 p-4">
                <p class="text-sm font-semibold text-white">Más opciones para ti</p>
                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                    @foreach ($ctas as $cta)
                        <a class="rounded-md border border-red-500/50 px-3 py-2 text-sm text-red-100 hover:border-red-400" href="{{ $cta['track_url'] }}" target="_blank" rel="sponsored noopener">
                            {{ $cta['label'] }}
                        </a>
                    @endforeach
                </div>
            </div>
        @endif
        @if ($related->isNotEmpty())
            <div class="flex gap-4 overflow-x-auto pb-2 sm:hidden">
                @foreach ($related as $item)
                    <div class="min-w-[220px] max-w-[220px]">
                        <x-video-card :video="$item" />
                    </div>
                @endforeach
            </div>
            <div class="hidden sm:block">
                <x-video-grid>
                    @foreach ($related as $item)
                        <x-video-card :video="$item" />
                    @endforeach
                </x-video-grid>
            </div>
        @else
            <p class="text-sm text-slate-400">Sin relacionados.</p>
        @endif
    </section>

    @if ($ctas)
        <div class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 p-3 backdrop-blur lg:hidden">
            <div class="flex items-center justify-between text-sm text-slate-100">
                <span class="font-semibold">Oferta destacada</span>
                <a class="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white" href="{{ $ctas[0]['track_url'] }}" target="_blank" rel="sponsored noopener">
                    {{ $ctas[0]['label'] }}
                </a>
            </div>
        </div>
    @endif
</x-layouts.public>

@push('head')
    <script nonce="{{ $cspNonce ?? '' }}">
        const videoId = @json($video->id);
        const sendEvent = (event, value = null) => {
            const url = new URL(@json(route('public.video.events')));
            url.searchParams.set('video_id', videoId);
            url.searchParams.set('event', event);
            if (value) {
                url.searchParams.set('value', value);
            }
            fetch(url.toString(), { method: 'GET', keepalive: true }).catch(() => {});
        };

        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-copy-url]');
            if (target) {
                const url = target.getAttribute('data-copy-url');
                if (url && navigator.clipboard) {
                    navigator.clipboard.writeText(url).catch(() => {});
                }
            }

            const playButton = event.target.closest('[data-embed-url]');
            if (playButton) {
                sendEvent('play');
            }
        });

        let scrollSent = false;
        window.addEventListener('scroll', () => {
            if (scrollSent) return;
            const scrollDepth = window.scrollY + window.innerHeight;
            const total = document.documentElement.scrollHeight;
            if (total > 0 && scrollDepth / total >= 0.5) {
                scrollSent = true;
                sendEvent('scroll_50');
            }
        }, { passive: true });
    </script>
@endpush
