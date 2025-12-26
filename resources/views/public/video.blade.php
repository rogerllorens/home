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
    $ctaVariantSeed = (string) (request()->ip() ?? request()->userAgent() ?? 'cta');
    $ctaVariant = crc32($ctaVariantSeed) % 2 === 0 ? 'A' : 'B';
    $primaryCtaClasses = $ctaVariant === 'B'
        ? 'bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white shadow-lg shadow-red-500/40 hover:from-red-500 hover:via-red-400 hover:to-orange-400'
        : 'bg-red-600 text-white hover:bg-red-500';
    $primaryCtaRing = $ctaVariant === 'B' ? 'focus-visible:ring-orange-300' : 'focus-visible:ring-red-400';
    $ctaContext = $video->category_slug
        ? \Illuminate\Support\Str::headline($video->category_slug)
        : ($tags[0] ?? null);
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
                'uploadDate' => optional($video->published_at)->toIso8601String(),
                'duration' => $durationIso,
                'embedUrl' => $video->embed_url ?: null,
                'url' => route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]),
                'interactionCount' => $viewsTotal ? "UserInteractions:{$viewsTotal}" : null,
                'interactionStatistic' => $viewsTotal ? [
                    '@type' => 'InteractionCounter',
                    'interactionType' => 'https://schema.org/WatchAction',
                    'userInteractionCount' => $viewsTotal,
                ] : null,
            ]), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
        </script>
    @endpush

    <section class="grid gap-8 lg:grid-cols-3 {{ $ctas ? 'pb-24 lg:pb-0' : '' }}">
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
            <div class="mt-6 space-y-6">
                <x-ad-slot slot-name="video_top" />
                <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <button
                        class="rounded-md bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        type="button"
                        data-copy-url="{{ request()->fullUrl() }}"
                    >
                        Copy link
                    </button>
                    <a class="rounded-md bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="mailto:?subject={{ urlencode($video->title) }}&body={{ urlencode(request()->fullUrl()) }}">
                        Share by email
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
                        <div class="flex aspect-video items-center justify-center text-sm text-slate-400">Embed unavailable.</div>
                    @endif
                </div>

                <div class="space-y-2">
                    <h1 class="text-3xl font-semibold text-white leading-tight md:text-4xl">{{ $video->title }}</h1>
                    <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        @if ($durationLabel)
                            <span class="rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">{{ $durationLabel }}</span>
                        @endif
                        @if ($formattedViews)
                            <span>• {{ $formattedViews }} views</span>
                        @endif
                        @if ($video->display_likes !== null)
                            <span class="flex items-center gap-1 text-rose-200">
                                <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <path d="M12 21s-6.7-4.35-9.33-7.5C.6 10.9 1.2 7.8 3.6 6.3c1.9-1.2 4.4-.9 6 1 1.6-1.9 4.1-2.2 6-1 2.4 1.5 3 4.6.93 7.2C18.7 16.65 12 21 12 21z"/>
                                </svg>
                                <span>{{ format_views($video->display_likes) }}</span>
                            </span>
                        @endif
                        @if ($timeAgo)
                            <span>• {{ $timeAgo }}</span>
                        @endif
                        <span>• {{ $video->published_at?->format('M d, Y') ?? '-' }}</span>
                        @if ($video->category_slug)
                            <span>• {{ \Illuminate\Support\Str::headline($video->category_slug) }}</span>
                        @endif
                    </div>
                </div>

                <div class="flex items-center gap-3">
                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-full border border-rose-500/60 px-3 py-1 text-xs font-semibold text-rose-100 hover:border-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        data-like-button
                        data-video-id="{{ $video->id }}"
                        data-liked="{{ $video->liked_by_device ? 'true' : 'false' }}"
                        aria-pressed="{{ $video->liked_by_device ? 'true' : 'false' }}"
                        aria-label="Like video"
                    >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M12 21s-6.7-4.35-9.33-7.5C.6 10.9 1.2 7.8 3.6 6.3c1.9-1.2 4.4-.9 6 1 1.6-1.9 4.1-2.2 6-1 2.4 1.5 3 4.6.93 7.2C18.7 16.65 12 21 12 21z"/>
                        </svg>
                        <span data-like-count>{{ $video->display_likes ?? 0 }}</span>
                        <span class="text-[11px] uppercase tracking-wide">Like</span>
                    </button>
                </div>

                @if ($ctas)
                    <div class="rounded-md border border-red-500/30 bg-red-500/10 p-4">
                        <p class="text-xs uppercase tracking-wide text-red-200">Featured offers</p>
                        <h2 class="mt-2 text-lg font-semibold text-white">Unlock more content</h2>
                        @if ($ctaContext)
                            <p class="mt-2 text-sm text-red-100/90">Más contenido como este en <span class="font-semibold text-white">{{ $ctaContext }}</span>.</p>
                        @endif
                        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            @foreach ($ctas as $cta)
                                <a
                                    class="flex flex-col justify-between rounded-md border border-red-500/40 px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $loop->first ? $primaryCtaClasses.' '.$primaryCtaRing : 'bg-red-600/20 text-white hover:bg-red-600/30 focus-visible:ring-red-400' }}"
                                    href="{{ $cta['track_url'] }}"
                                    target="_blank"
                                    rel="sponsored noopener"
                                >
                                    <span class="text-xs uppercase tracking-wide text-red-100">{{ $cta['label'] }}</span>
                                    <span class="mt-2 text-base font-semibold">{{ $cta['title'] }}</span>
                                    <span class="mt-2 text-sm font-normal text-red-100/90 leading-relaxed">{{ $cta['description'] }}</span>
                                </a>
                            @endforeach
                        </div>
                    </div>
                @endif

                <div class="space-y-2">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">Tags</p>
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                        @if ($video->category_slug)
                            <a class="rounded-full border border-red-500/50 px-3 py-1 font-semibold text-red-100 hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.category', $video->category_slug) }}">
                                {{ \Illuminate\Support\Str::headline($video->category_slug) }}
                            </a>
                        @endif
                        @foreach ($tags as $tag)
                            <a class="rounded-full bg-white/5 px-3 py-1 text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.tag', $tag) }}">
                                #{{ $tag }}
                            </a>
                        @endforeach
                        @if (empty($tags))
                            <span class="text-slate-400">No tags yet.</span>
                        @endif
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-3 text-sm">
                    @if ($video->category_slug)
                        <a class="rounded-md bg-white/5 px-3 py-2 font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.category', $video->category_slug) }}">
                            Back to {{ \Illuminate\Support\Str::headline($video->category_slug) }}
                        </a>
                    @endif
                    @if ($nextVideo)
                        <a class="rounded-md border border-red-500/60 px-3 py-2 font-semibold text-red-100 hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($nextVideo->seo_title ?: $nextVideo->title), 'id' => $nextVideo->id]) }}" data-autoplay-next>
                            Play next
                        </a>
                    @endif
                    @if ($categoryShuffle)
                        <a class="rounded-md bg-white/5 px-3 py-2 font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($categoryShuffle->seo_title ?: $categoryShuffle->title), 'id' => $categoryShuffle->id]) }}">
                            Shuffle category
                        </a>
                    @endif
                </div>

                @if ($video->description)
                    <p class="text-sm text-slate-300 leading-relaxed">{{ $video->description }}</p>
                @endif
            </div>
        </div>

        <aside class="space-y-4">
            <x-ad-slot slot-name="video_sidebar" />
            <div class="rounded-md border border-white/10 bg-white/5 p-4">
                <h2 class="text-sm font-semibold text-white">Detalles</h2>
                <div class="mt-3 space-y-2 text-xs text-slate-400">
                    <p>Status: {{ $video->status->value }}</p>
                    <p>Category: {{ $video->category_slug ? \Illuminate\Support\Str::headline($video->category_slug) : 'N/A' }}</p>
                    <p>Published: {{ $video->published_at?->format('d/m/Y') ?? '-' }}</p>
                </div>
            </div>
            @if ($ctas)
                <div class="rounded-md border border-white/10 bg-white/5 p-4">
                    <h2 class="text-sm font-semibold text-white">Featured offers</h2>
                    @if ($ctaContext)
                        <p class="mt-2 text-xs text-slate-300">Más contenido como este en {{ $ctaContext }}.</p>
                    @endif
                    <div class="mt-3 space-y-2 text-sm text-slate-300">
                        @foreach ($ctas as $cta)
                            <a class="block rounded-md px-3 py-2 {{ $loop->first ? $primaryCtaClasses.' '.$primaryCtaRing : 'bg-red-600/20 text-red-100 hover:bg-red-600/30 focus-visible:ring-red-400' }} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ $cta['track_url'] }}" target="_blank" rel="sponsored noopener">
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
            <div>
                <h2 class="text-lg font-semibold text-white">More like this</h2>
                <p class="mt-1 text-sm text-slate-400">Sugerencias similares para seguir viendo sin interrupciones.</p>
            </div>
        </div>
        @if ($ctas)
            <div class="mb-6 rounded-md border border-white/10 bg-white/5 p-4">
                <p class="text-sm font-semibold text-white">More options for you</p>
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
        <div class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur lg:hidden">
            <div class="flex items-center justify-between text-sm text-slate-100">
                <span class="font-semibold">Featured offer</span>
                <a class="rounded-md px-3 py-2 text-sm font-semibold {{ $primaryCtaClasses }} focus-visible:outline-none focus-visible:ring-2 {{ $primaryCtaRing }} focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ $ctas[0]['track_url'] }}" target="_blank" rel="sponsored noopener">
                    {{ $ctas[0]['label'] }}
                </a>
            </div>
        </div>
    @endif
</x-layouts.public>

@push('head')
    <script nonce="{{ $cspNonce ?? '' }}">
        const videoId = @json($video->id);
        const storageKey = 'continue_watching';
        const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (Array.isArray(stored)) {
            const filtered = stored.filter((id) => id !== videoId);
            filtered.unshift(videoId);
            localStorage.setItem(storageKey, JSON.stringify(filtered.slice(0, 10)));
        }
        const sendEvent = (event, value = null) => {
            const url = new URL(@json(route('public.video.events')));
            url.searchParams.set('video_id', videoId);
            url.searchParams.set('event', event);
            if (value) {
                url.searchParams.set('value', value);
            }
            if (navigator.sendBeacon) {
                const blob = new Blob([], { type: 'application/x-www-form-urlencoded' });
                navigator.sendBeacon(url.toString(), blob);
                return;
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

            const nextButton = event.target.closest('[data-autoplay-next]');
            if (nextButton && new URL(window.location.href).searchParams.get('autoplay') === '1') {
                event.preventDefault();
                const nextUrl = nextButton.getAttribute('href');
                if (nextUrl) {
                    setTimeout(() => {
                        window.location.assign(nextUrl);
                    }, 1500);
                }
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

        const likeButton = document.querySelector('[data-like-button]');
        if (likeButton) {
            const initialLiked = likeButton.getAttribute('data-liked') === 'true';
            if (initialLiked) {
                likeButton.classList.add('bg-rose-500/20');
            }
            likeButton.addEventListener('click', async () => {
                const videoIdValue = likeButton.getAttribute('data-video-id');
                if (!videoIdValue) return;

                try {
                    const response = await fetch(`/videos/${videoIdValue}/like`, {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN': @json(csrf_token()),
                            'Accept': 'application/json',
                        },
                    });
                    if (!response.ok) return;
                    const payload = await response.json();
                    const countEl = likeButton.querySelector('[data-like-count]');
                    if (countEl && typeof payload.likes_count !== 'undefined') {
                        countEl.textContent = payload.likes_count;
                    }
                    likeButton.setAttribute('aria-pressed', payload.liked ? 'true' : 'false');
                    likeButton.classList.toggle('bg-rose-500/20', payload.liked);
                } catch (error) {
                    // no-op
                }
            });
        }
    </script>
@endpush
