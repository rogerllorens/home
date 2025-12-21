@php
    $thumbnail = $video->thumbnail_url ?: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1280&q=80';
    $tags = array_slice($video->raw_tags ?? [], 0, 12);
    $publishedAt = $video->published_at ?? $video->created_at;
    $timeAgo = $publishedAt ? time_ago($publishedAt) : '';
    $viewsTotal = $video->display_views;
    $formattedViews = $viewsTotal ? format_views($viewsTotal) : null;
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

<x-layouts.public title="{{ $video->seo_title ?: $video->title }}">
    @push('head')
        <link rel="canonical" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]) }}">
        <meta name="description" content="{{ $video->seo_description ?: \Illuminate\Support\Str::limit(strip_tags($video->description ?? ''), 160) }}">
        @if ($noindex)
            <meta name="robots" content="noindex,nofollow">
        @endif
        <meta property="og:title" content="{{ $video->seo_title ?: $video->title }}">
        <meta property="og:description" content="{{ $video->seo_description ?: \Illuminate\Support\Str::limit(strip_tags($video->description ?? ''), 160) }}">
        <meta property="og:type" content="video.other">
        <meta property="og:url" content="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]) }}">
        <meta property="og:image" content="{{ $thumbnail }}">
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
            ]), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
        </script>
    @endpush

    <section class="grid gap-8 lg:grid-cols-3">
        <div class="lg:col-span-2">
            <h1 class="text-2xl font-semibold text-white">{{ $video->title }}</h1>
            <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                @if ($durationLabel)
                    <span class="rounded bg-black/70 px-2 py-0.5 text-[11px] font-semibold text-white">{{ $durationLabel }}</span>
                @endif
                <span>{{ $timeAgo }}</span>
                @if ($formattedViews)
                    <span>• {{ $formattedViews }} views</span>
                @endif
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
                @if ($video->category_slug)
                    <a class="rounded-full border border-red-500/50 px-3 py-1 text-xs font-semibold text-red-100" href="{{ route('public.category', $video->category_slug) }}">
                        {{ \Illuminate\Support\Str::headline($video->category_slug) }}
                    </a>
                @endif
                @foreach ($tags as $tag)
                    <a class="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200 hover:bg-white/10" href="{{ route('public.tag', $tag) }}">
                        #{{ $tag }}
                    </a>
                @endforeach
            </div>

            <div class="mt-6 space-y-4">
                @if ($isUnavailable)
                    <div class="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                        Video unavailable.
                    </div>
                @endif
                <div class="overflow-hidden rounded-md border border-red-600/30 bg-black">
                    @php
                        $iframeSandbox = $video->source?->settings['iframe_sandbox'] ?? 'allow-scripts allow-same-origin allow-presentation';
                        $iframeAllow = $video->source?->settings['iframe_allow'] ?? 'fullscreen';
                    @endphp
                    @if (!$isUnavailable && $video->embed_url)
                        <div class="relative aspect-video" id="embed-container" data-embed-container>
                            <img src="{{ $thumbnail }}" alt="{{ $video->title }}" class="h-full w-full object-cover" loading="lazy" decoding="async">
                            <button
                                class="absolute inset-0 flex items-center justify-center bg-black/60 text-white"
                                type="button"
                                data-embed-url="{{ $video->embed_url }}"
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

                <div class="flex flex-wrap items-center gap-3 text-sm">
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

            @if ($ctas)
                <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($ctas as $cta)
                        <div class="rounded-md border border-white/10 bg-white/5 p-4">
                            <p class="text-xs uppercase text-slate-400">{{ $cta['label'] }}</p>
                            <h3 class="mt-2 text-base font-semibold text-white">{{ $cta['title'] }}</h3>
                            <p class="mt-2 text-sm text-slate-300">{{ $cta['description'] }}</p>
                            <a class="mt-4 inline-flex text-sm font-semibold text-red-300 hover:text-red-200" href="{{ $cta['url'] }}" target="_blank" rel="noopener">Ver oferta</a>
                        </div>
                    @endforeach
                </div>
            @endif
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
        </aside>
    </section>

    <section class="mt-10">
        <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">Related videos</h2>
        </div>
        <x-video-grid>
            @forelse ($related as $item)
                <x-video-card :video="$item" />
            @empty
                <p class="text-sm text-slate-400">Sin relacionados.</p>
            @endforelse
        </x-video-grid>
    </section>
</x-layouts.public>
