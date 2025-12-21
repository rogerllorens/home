@php
    $thumbnail = $video->thumbnail_url ?: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1280&q=80';
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
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="{{ $video->seo_title ?: $video->title }}">
        <meta name="twitter:description" content="{{ $video->seo_description ?: \Illuminate\Support\Str::limit(strip_tags($video->description ?? ''), 160) }}">
        <meta name="twitter:image" content="{{ $thumbnail }}">
        <script type="application/ld+json" nonce="{{ $cspNonce ?? '' }}">
            {!! json_encode([
                '@context' => 'https://schema.org',
                '@type' => 'VideoObject',
                'name' => $video->seo_title ?: $video->title,
                'description' => $video->seo_description ?: strip_tags($video->description ?? ''),
                'thumbnailUrl' => [$thumbnail],
                'uploadDate' => optional($video->published_at)->toIso8601String(),
                'contentUrl' => $video->embed_url,
                'duration' => $video->duration_seconds ? 'PT' . $video->duration_seconds . 'S' : null,
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
        </script>
    @endpush

    <section class="grid gap-8 lg:grid-cols-3">
        <div class="lg:col-span-2">
            <h1 class="text-2xl font-semibold">{{ $video->title }}</h1>
            <p class="mt-2 text-sm text-slate-400">{{ $video->description }}</p>

            <div class="mt-6 space-y-4">
                @if ($isUnavailable)
                    <div class="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        Video currently unavailable.
                    </div>
                @endif
                <div class="overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                    @php
                        $iframeSandbox = $video->source?->settings['iframe_sandbox'] ?? 'allow-scripts allow-same-origin allow-presentation';
                        $iframeAllow = $video->source?->settings['iframe_allow'] ?? 'fullscreen';
                    @endphp
                    @if (!$isUnavailable && $video->embed_url)
                        <div class="relative aspect-video" id="embed-container" data-embed-container>
                            <img src="{{ $thumbnail }}" alt="{{ $video->title }}" class="h-full w-full object-cover" loading="lazy">
                            <button
                                class="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-white"
                                type="button"
                                data-embed-url="{{ $video->embed_url }}"
                                data-embed-container="#embed-container"
                                data-iframe-sandbox="{{ $iframeSandbox }}"
                                data-iframe-allow="{{ $iframeAllow }}"
                            >
                                <span class="rounded-full bg-indigo-500 px-6 py-3 text-sm font-semibold">Play</span>
                            </button>
                        </div>
                    @elseif (!$isUnavailable && $sanitizedEmbed)
                        <div class="aspect-video">{!! $sanitizedEmbed !!}</div>
                    @else
                        <div class="flex aspect-video items-center justify-center text-sm text-slate-400">Embed no disponible.</div>
                    @endif
                </div>
            </div>

            @if ($ctas)
                <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    @foreach ($ctas as $cta)
                        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                            <p class="text-xs uppercase text-slate-400">{{ $cta['label'] }}</p>
                            <h3 class="mt-2 text-base font-semibold">{{ $cta['title'] }}</h3>
                            <p class="mt-2 text-sm text-slate-400">{{ $cta['description'] }}</p>
                            <a class="mt-4 inline-flex text-sm text-indigo-300 hover:text-indigo-200" href="{{ $cta['url'] }}" target="_blank" rel="noopener">Ver oferta</a>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>

        <aside class="space-y-4">
            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                <h2 class="text-sm font-semibold">Detalles</h2>
                <div class="mt-3 space-y-2 text-xs text-slate-400">
                    <p>Estado: {{ $video->status->value }}</p>
                    <p>Categoría: {{ $video->category_slug ? \Illuminate\Support\Str::headline($video->category_slug) : 'N/A' }}</p>
                    <p>Publicado: {{ $video->published_at?->format('d/m/Y') ?? '-' }}</p>
                </div>
            </div>
            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                <h2 class="text-sm font-semibold">Relacionados</h2>
                <div class="mt-3 space-y-3">
                    @forelse ($related as $item)
                        <a class="block text-sm text-indigo-200" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($item->seo_title ?: $item->title), 'id' => $item->id]) }}">
                            {{ $item->title }}
                        </a>
                    @empty
                        <p class="text-sm text-slate-400">Sin relacionados.</p>
                    @endforelse
                </div>
            </div>
        </aside>
    </section>
</x-layouts.public>
