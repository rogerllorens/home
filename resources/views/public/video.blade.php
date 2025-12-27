@php
    $thumbnail = $video->thumbnail_url ?: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1280&q=80';
    $tags = array_slice($video->raw_tags ?? [], 0, 12);
    $publishedAt = $video->published_at ?? $video->created_at;
    $timeAgo = $publishedAt ? time_ago($publishedAt) : '';
    $viewsTotal = $video->display_views;
    $formattedViews = $viewsTotal ? format_views($viewsTotal) : null;
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = \Illuminate\Support\Str::limit(__('ui.meta.title_with_brand', ['title' => $video->seo_title ?: $video->title, 'brand' => $brand]), $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit($video->seo_description ?: strip_tags($video->description ?? ''), $descMax, '');
    $structuredDescription = $pageDescription ?: ($video->seo_description ?: strip_tags($video->description ?? ''));
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
    $qualityScore = $video->quality_score;
    $categoryLabel = $video->category_slug ? \Illuminate\Support\Str::headline($video->category_slug) : null;
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
                        'name' => __('ui.nav.home'),
                        'item' => route('public.home'),
                    ],
                    $video->category_slug ? [
                        '@type' => 'ListItem',
                        'position' => 2,
                        'name' => $categoryLabel,
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
                'description' => $structuredDescription ?: null,
                'thumbnailUrl' => [$thumbnail],
                'datePublished' => optional($video->published_at)->toIso8601String(),
                'uploadDate' => optional($video->published_at)->toIso8601String(),
                'duration' => $durationIso,
                'embedUrl' => $embedUrl ?: ($video->embed_url ?: null),
                'contentUrl' => $video->source_url ?: route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]),
                'url' => route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]),
                'keywords' => $tags,
                'genre' => $categoryLabel,
                'inLanguage' => $video->language ?: null,
                'interactionCount' => $viewsTotal ? "UserInteractions:{$viewsTotal}" : null,
                'interactionStatistic' => $viewsTotal ? [
                    '@type' => 'InteractionCounter',
                    'interactionType' => 'https://schema.org/WatchAction',
                    'userInteractionCount' => $viewsTotal,
                ] : null,
            ]), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
        </script>
    @endpush

    <section class="space-y-8 {{ $ctas ? 'pb-24 lg:pb-0' : '' }}">
        <nav class="text-xs text-slate-400">
            <a class="hover:text-slate-200" href="{{ route('public.home') }}">{{ __('ui.nav.home') }}</a>
            @if ($video->category_slug)
                <span>›</span>
                <a class="hover:text-slate-200" href="{{ route('public.category', $video->category_slug) }}">
                    {{ $categoryLabel }}
                </a>
            @endif
            <span>›</span>
            <span class="text-slate-200">{{ $video->title }}</span>
        </nav>

        <div class="space-y-6">
            <x-ad-slot slot-name="video_top" />
            @if ($isUnavailable)
                <div class="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {{ __('ui.video.unavailable') }}
                </div>
            @endif
            <div class="overflow-hidden rounded-xl border border-red-600/30 bg-black shadow-lg shadow-black/30">
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
                                aria-label="{{ __('ui.video.play_video') }}"
                            >
                                <span class="rounded-full bg-red-600 px-8 py-3 text-sm font-semibold shadow-lg shadow-red-600/40">{{ __('ui.video.play') }}</span>
                            </button>
                        </div>
                @elseif (!$isUnavailable && $sanitizedEmbed)
                    <div class="aspect-video">{!! $sanitizedEmbed !!}</div>
                @else
                    <div class="flex aspect-video items-center justify-center text-sm text-slate-400">{{ __('ui.video.embed_unavailable') }}</div>
                @endif
            </div>
        </div>

        <div class="grid gap-8 lg:grid-cols-[2fr,1fr]">
            <div class="space-y-6">
                <div class="space-y-3">
                    <h1 class="text-3xl font-semibold text-white leading-tight md:text-4xl">{{ $video->title }}</h1>
                    <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
                        @if ($formattedViews)
                            <span class="font-semibold text-slate-200">{{ __('ui.video.views', ['count' => $formattedViews]) }}</span>
                        @endif
                        @if ($timeAgo)
                            <span>• {{ $timeAgo }}</span>
                        @endif
                        <span>• {{ $video->published_at?->format('M d, Y') ?? '-' }}</span>
                        @if ($durationLabel)
                            <span class="rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">{{ $durationLabel }}</span>
                        @endif
                        @if ($qualityScore > 0)
                            <span class="rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">{{ __('ui.video.quality', ['score' => $qualityScore]) }}</span>
                        @endif
                    </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 text-xs">
                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-full border border-rose-500/60 px-3 py-2 font-semibold text-rose-100 transition hover:border-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $video->liked_by_device ? 'bg-rose-500/20' : '' }}"
                        data-like-button
                        data-video-id="{{ $video->id }}"
                        data-liked="{{ $video->liked_by_device ? 'true' : 'false' }}"
                        aria-pressed="{{ $video->liked_by_device ? 'true' : 'false' }}"
                        aria-label="{{ __('ui.video.like_video') }}"
                    >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M12 21s-6.7-4.35-9.33-7.5C.6 10.9 1.2 7.8 3.6 6.3c1.9-1.2 4.4-.9 6 1 1.6-1.9 4.1-2.2 6-1 2.4 1.5 3 4.6.93 7.2C18.7 16.65 12 21 12 21z"/>
                        </svg>
                        <span data-like-count>{{ $video->display_likes ?? 0 }}</span>
                        <span class="text-[11px] uppercase tracking-wide">{{ __('ui.buttons.like') }}</span>
                    </button>
                    <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $video->favorited_by_device ? 'bg-white/10' : '' }}"
                        data-favorite-button
                        data-favorited="{{ $video->favorited_by_device ? 'true' : 'false' }}"
                        data-favorite-add-url="{{ route('public.favorites.store', $video) }}"
                        data-favorite-remove-url="{{ route('public.favorites.destroy', $video) }}"
                        aria-pressed="{{ $video->favorited_by_device ? 'true' : 'false' }}"
                        aria-label="{{ __('ui.video.toggle_favorite') }}"
                    >
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z"/>
                        </svg>
                        <span data-favorite-label>{{ $video->favorited_by_device ? __('ui.favorites.remove') : __('ui.favorites.add') }}</span>
                    </button>
                    <button
                        class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 font-semibold text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        type="button"
                        data-copy-url="{{ request()->fullUrl() }}"
                    >
                        {{ __('ui.video.copy_link') }}
                    </button>
                    <a class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="mailto:?subject={{ urlencode($video->title) }}&body={{ urlencode(request()->fullUrl()) }}">
                        {{ __('ui.video.share') }}
                    </a>
                </div>

                <div class="space-y-2">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ __('ui.video.categories_tags') }}</p>
                    <div class="flex flex-wrap items-center gap-2 text-xs">
                        @if ($video->category_slug)
                            <a class="rounded-full border border-red-500/50 px-3 py-1 font-semibold text-red-100 hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.category', $video->category_slug) }}">
                                {{ $categoryLabel }}
                            </a>
                        @endif
                        @foreach ($tags as $tag)
                            <a class="rounded-full bg-white/5 px-3 py-1 text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.tag', $tag) }}">
                                #{{ $tag }}
                            </a>
                        @endforeach
                        @if (empty($tags))
                            <span class="text-slate-400">{{ __('ui.video.no_tags') }}</span>
                        @endif
                    </div>
                </div>

                @if ($video->description)
                    <div class="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                        {{ $video->description }}
                    </div>
                @endif

                @if (!empty($transparencyTags))
                    <div class="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ __('ui.video.transparency.title') }}</p>
                        <p class="mt-2 text-sm text-slate-300">{{ __('ui.video.transparency.description') }}</p>
                        <div class="mt-3 flex flex-wrap gap-2 text-xs">
                            @foreach ($transparencyTags as $tag)
                                <span class="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 font-semibold text-slate-200">
                                    {{ __('ui.video.transparency.tags.' . $tag . '.label') }}
                                </span>
                            @endforeach
                        </div>
                        <ul class="mt-3 space-y-1 text-xs text-slate-400">
                            @foreach ($transparencyTags as $tag)
                                <li>{{ __('ui.video.transparency.tags.' . $tag . '.description') }}</li>
                            @endforeach
                        </ul>
                    </div>
                @endif

                @feature('video_cta_placement', 'B')
                    <div class="rounded-md border border-white/10 bg-white/5 p-4">
                        <p class="text-xs uppercase tracking-wide text-slate-400">{{ __('ui.video.featured_offers') }}</p>
                        <h2 class="mt-2 text-lg font-semibold text-white">{{ __('ui.video.unlock_more') }}</h2>
                        @if ($ctaContext)
                            <p class="mt-2 text-sm text-slate-200">{!! __('ui.video.more_content_context', ['context' => '<span class=\"font-semibold text-white\">' . e($ctaContext) . '</span>']) !!}</p>
                        @endif
                        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            @foreach ($ctas as $cta)
                                <a
                                    class="flex flex-col justify-between rounded-md border border-white/10 px-4 py-3 text-sm font-semibold text-slate-100 hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                                    href="{{ $cta['track_url'] }}"
                                    target="_blank"
                                    rel="sponsored noopener"
                                    data-track-cta
                                    data-cta-id="{{ $cta['public_id'] }}"
                                    data-cta-origin="{{ $cta['origin_page'] }}"
                                    data-cta-video="{{ $video->id }}"
                                    data-video-id="{{ $video->id }}"
                                    data-cta-key="{{ $cta['key'] ?? '' }}"
                                    data-cta-label="{{ $cta['label'] ?? '' }}"
                                    data-cta-context="video_detail"
                                >
                                    <span class="text-xs uppercase tracking-wide text-slate-300">{{ $cta['label'] }}</span>
                                    <span class="mt-2 text-base font-semibold">{{ $cta['title'] }}</span>
                                    <span class="mt-2 text-sm font-normal text-slate-200 leading-relaxed">{{ $cta['description'] }}</span>
                                </a>
                            @endforeach
                        </div>
                    </div>
                @else
@if ($ctas)
                    <div class="rounded-md border border-red-500/30 bg-red-500/10 p-4">
                        <p class="text-xs uppercase tracking-wide text-red-200">{{ __('ui.video.featured_offers') }}</p>
                        <h2 class="mt-2 text-lg font-semibold text-white">{{ __('ui.video.unlock_more') }}</h2>
                        @if ($ctaContext)
                            <p class="mt-2 text-sm text-red-100/90">{!! __('ui.video.more_content_context', ['context' => '<span class=\"font-semibold text-white\">' . e($ctaContext) . '</span>']) !!}</p>
                        @endif
                        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            @foreach ($ctas as $cta)
                                <a
                                    class="flex flex-col justify-between rounded-md border border-red-500/40 px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $loop->first ? $primaryCtaClasses.' '.$primaryCtaRing : 'bg-red-600/20 text-white hover:bg-red-600/30 focus-visible:ring-red-400' }}"
                                    href="{{ $cta['track_url'] }}"
                                    target="_blank"
                                    rel="sponsored noopener"
                                    data-track-cta
                                    data-cta-id="{{ $cta['public_id'] }}"
                                    data-cta-origin="{{ $cta['origin_page'] }}"
                                    data-cta-video="{{ $video->id }}"
                                    data-video-id="{{ $video->id }}"
                                    data-cta-key="{{ $cta['key'] ?? '' }}"
                                    data-cta-label="{{ $cta['label'] ?? '' }}"
                                    data-cta-context="video_detail"
                                >
                                    <span class="text-xs uppercase tracking-wide text-red-100">{{ $cta['label'] }}</span>
                                    <span class="mt-2 text-base font-semibold">{{ $cta['title'] }}</span>
                                    <span class="mt-2 text-sm font-normal text-red-100/90 leading-relaxed">{{ $cta['description'] }}</span>
                                </a>
                            @endforeach
                        </div>
                    </div>
                @endif
                @endfeature

                <div class="flex flex-wrap items-center gap-3 text-sm">
                    @if ($video->category_slug)
                        <a class="rounded-md bg-white/5 px-3 py-2 font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.category', $video->category_slug) }}">
                            {{ __('ui.video.back_to', ['category' => $categoryLabel]) }}
                        </a>
                    @endif
                    @php
                        $autoplayNext = $journeyNextVideo ?: $nextVideo;
                        $autoplayParams = $journeyContext ? ['journey' => $journeyContext->slug] : [];
                    @endphp
                    @if ($autoplayNext)
                        <a class="rounded-md border border-red-500/60 px-3 py-2 font-semibold text-red-100 hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($autoplayNext->seo_title ?: $autoplayNext->title), 'id' => $autoplayNext->id] + $autoplayParams) }}" data-autoplay-next>
                            {{ __('ui.buttons.play_next') }}
                        </a>
                    @endif
                    @if ($categoryShuffle)
                        <a class="rounded-md bg-white/5 px-3 py-2 font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($categoryShuffle->seo_title ?: $categoryShuffle->title), 'id' => $categoryShuffle->id]) }}">
                            {{ __('ui.buttons.shuffle_category') }}
                        </a>
                    @endif
                </div>

                @if ($journeyContext || $video->journeys->isNotEmpty())
                    <div class="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ __('ui.video.journey.title') }}</p>
                        @if ($journeyContext)
                            <p class="mt-2 text-sm text-slate-300">{{ __('ui.video.journey.context', ['journey' => $journeyContext->title]) }}</p>
                            <div class="mt-3 flex flex-wrap gap-2 text-sm">
                                <a class="rounded-md bg-white/5 px-3 py-2 font-semibold text-slate-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.journeys.show', $journeyContext->slug) }}">
                                    {{ __('ui.video.journey.view') }}
                                </a>
                                @if ($journeyNextVideo)
                                    <a class="rounded-md border border-white/10 px-3 py-2 font-semibold text-slate-100 hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($journeyNextVideo->seo_title ?: $journeyNextVideo->title), 'id' => $journeyNextVideo->id, 'journey' => $journeyContext->slug]) }}">
                                        {{ __('ui.video.journey.next') }}
                                    </a>
                                @endif
                            </div>
                        @else
                            <p class="mt-2 text-sm text-slate-300">{{ __('ui.video.journey.part_of') }}</p>
                            <div class="mt-3 flex flex-wrap gap-2 text-sm">
                                @foreach ($video->journeys as $journey)
                                    <a class="rounded-md border border-white/10 px-3 py-2 font-semibold text-slate-100 hover:border-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.journeys.show', $journey->slug) }}">
                                        {{ $journey->title }}
                                    </a>
                                @endforeach
                            </div>
                        @endif
                    </div>
                @endif
            </div>

            <aside class="space-y-6">
                <x-ad-slot slot-name="video_sidebar" />
                @if ($deviceRecommendations->isNotEmpty())
                    <div class="rounded-md border border-white/10 bg-white/5 p-4">
                        <h2 class="text-lg font-semibold text-white">{{ __('ui.video.recommended') }}</h2>
                        <p class="mt-1 text-xs text-slate-400">{{ __('ui.video.recommended_intro') }}</p>
                        <div class="mt-4 space-y-3">
                            @foreach ($deviceRecommendations as $item)
                                <x-video-card :video="$item" variant="dense" />
                            @endforeach
                        </div>
                    </div>
                @endif
                <div class="rounded-md border border-white/10 bg-white/5 p-4">
                    <h2 class="text-lg font-semibold text-white">{{ __('ui.video.related') }}</h2>
                    <p class="mt-1 text-xs text-slate-400">{{ __('ui.video.related_intro') }}</p>
                    <div class="mt-4 space-y-3">
                        @forelse ($related as $item)
                            <x-video-card :video="$item" variant="dense" />
                        @empty
                            <p class="text-sm text-slate-400">{{ __('ui.video.no_recommendations') }}</p>
                        @endforelse
                    </div>
                </div>

                @if ($categoryRelatedVideos->isNotEmpty())
                    <div class="rounded-md border border-white/10 bg-white/5 p-4">
                        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-400">{{ __('ui.video.more_in', ['category' => $categoryLabel]) }}</h3>
                        <div class="mt-3 space-y-3">
                            @foreach ($categoryRelatedVideos as $item)
                                <x-video-card :video="$item" variant="dense" />
                            @endforeach
                        </div>
                    </div>
                @endif

                @if ($tagRelatedVideos->isNotEmpty())
                    <div class="rounded-md border border-white/10 bg-white/5 p-4">
                        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-400">{{ __('ui.video.similar_tags') }}</h3>
                        <div class="mt-3 space-y-3">
                            @foreach ($tagRelatedVideos as $item)
                                <x-video-card :video="$item" variant="dense" />
                            @endforeach
                        </div>
                    </div>
                @endif

                @if ($shuffleVideo)
                    <div class="rounded-md border border-white/10 bg-white/5 p-4">
                        <h3 class="text-sm font-semibold uppercase tracking-wide text-slate-400">{{ __('ui.video.shuffle_pick') }}</h3>
                        <div class="mt-3">
                            <x-video-card :video="$shuffleVideo" variant="dense" />
                        </div>
                    </div>
                @endif
            </aside>
        </div>
    </section>

    @if ($ctas)
        <div class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/90 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur lg:hidden">
            <div class="flex items-center justify-between text-sm text-slate-100">
                <span class="font-semibold">{{ __('ui.video.featured_offer_single') }}</span>
                <a
                    class="rounded-md px-3 py-2 text-sm font-semibold {{ $primaryCtaClasses }} focus-visible:outline-none focus-visible:ring-2 {{ $primaryCtaRing }} focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    href="{{ $ctas[0]['track_url'] }}"
                    target="_blank"
                    rel="sponsored noopener"
                    data-cta-id="{{ $ctas[0]['public_id'] }}"
                    data-cta-origin="{{ $ctas[0]['origin_page'] }}"
                    data-cta-video="{{ $video->id }}"
                >
                    {{ $ctas[0]['label'] }}
                </a>
            </div>
        </div>
    @endif
</x-layouts.public>

@push('head')
    <script nonce="{{ $cspNonce ?? '' }}">
        const trackEvent = window.trackEvent || (async (eventName, properties = {}) => {
            try {
                await fetch(@json(route('public.events.track')), {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': @json(csrf_token()),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        event: eventName,
                        properties,
                    }),
                });
            } catch (error) {
                // no-op
            }
        });

        document.addEventListener('DOMContentLoaded', () => {
            const variant = @json(app(\App\Services\FeatureFlags\FeatureFlagService::class)->variantFor(
                'video_cta_placement',
                \App\Support\DeviceHash::fromRequest(request()),
                'A'
            ));
            if (window.trackEvent) {
                window.trackEvent('experiment.view', {
                    experiment: 'video_cta_placement',
                    variant,
                });
            }
        });

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
                trackEvent('video.play', { video_id: videoId });
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
                trackEvent('video.progress', { video_id: videoId, percent: 50 });
            }
        }, { passive: true });

        let progressTimers = [];
        const scheduleProgress = () => {
            progressTimers.forEach((timer) => clearTimeout(timer));
            progressTimers = [
                setTimeout(() => trackEvent('video.progress', { video_id: videoId, percent: 25 }), 15000),
                setTimeout(() => trackEvent('video.progress', { video_id: videoId, percent: 75 }), 45000),
                setTimeout(() => trackEvent('video.completed', { video_id: videoId, percent: 100 }), 60000),
            ];
        };

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

        const favoriteButton = document.querySelector('[data-favorite-button]');
        if (favoriteButton) {
            const label = favoriteButton.querySelector('[data-favorite-label]');
            const updateFavoriteState = (favorited) => {
                favoriteButton.setAttribute('data-favorited', favorited ? 'true' : 'false');
                favoriteButton.setAttribute('aria-pressed', favorited ? 'true' : 'false');
                favoriteButton.classList.toggle('bg-white/10', favorited);
                if (label) {
                    label.textContent = favorited
                        ? @json(__('ui.favorites.remove'))
                        : @json(__('ui.favorites.add'));
                }
            };

            updateFavoriteState(favoriteButton.getAttribute('data-favorited') === 'true');

            favoriteButton.addEventListener('click', async () => {
                const favorited = favoriteButton.getAttribute('data-favorited') === 'true';
                const url = favorited
                    ? favoriteButton.getAttribute('data-favorite-remove-url')
                    : favoriteButton.getAttribute('data-favorite-add-url');
                if (!url) return;

                try {
                    const response = await fetch(url, {
                        method: favorited ? 'DELETE' : 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN': @json(csrf_token()),
                            'Accept': 'application/json',
                        },
                    });
                    if (!response.ok) return;
                    const payload = await response.json();
                    updateFavoriteState(Boolean(payload.favorited));
                } catch (error) {
                    // no-op
                }
            });
        }

        document.addEventListener('click', (event) => {
            const cta = event.target.closest('[data-track-cta]');
            if (cta) {
                trackEvent('cta.click', {
                    video_id: cta.getAttribute('data-video-id'),
                    cta_key: cta.getAttribute('data-cta-key'),
                    cta_label: cta.getAttribute('data-cta-label'),
                    context: cta.getAttribute('data-cta-context'),
                });
            }

            const playButton = event.target.closest('[data-embed-url]');
            if (playButton) {
                scheduleProgress();
            }
        });
    </script>
@endpush
