<x-layouts.public title="{{ $heading }} | Candid Boys">
    @push('head')
        <x-seo-head
            title="{{ $heading }} | Candid Boys"
            description="{{ $description }}"
            canonical="{{ request()->fullUrl() }}"
        />
        <script type="application/ld+json" nonce="{{ $cspNonce ?? '' }}">
            {!! json_encode([
                '@context' => 'https://schema.org',
                '@type' => 'ItemList',
                'itemListElement' => $videos->map(function ($video, $index) {
                    return [
                        '@type' => 'ListItem',
                        'position' => $index + 1,
                        'url' => route('public.video', [
                            'slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title),
                            'id' => $video->id,
                        ]),
                        'name' => $video->seo_title ?: $video->title,
                    ];
                })->values()->all(),
            ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
        </script>
    @endpush

    <section class="mb-6">
        <h1 class="text-2xl font-semibold text-white">{{ $heading }}</h1>
        <p class="mt-2 text-sm text-slate-300">{{ $description }}</p>
        @if ($videos->isEmpty())
            <p class="mt-4 text-sm text-slate-400">Explora otras categorías o vuelve más tarde para nuevos videos.</p>
            <a class="mt-3 inline-flex rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500" href="{{ route('public.home') }}">
                Explorar recientes
            </a>
        @endif
    </section>

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" :show-category="false" />
        @empty
            <p class="text-sm text-slate-400">No hay videos en esta categoría.</p>
        @endforelse
    </x-video-grid>

    <div class="mt-6">
        {{ $videos->links() }}
    </div>
</x-layouts.public>
