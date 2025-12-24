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

    <section class="mb-8">
        <h1 class="text-2xl font-semibold">Tag: {{ $heading }}</h1>
        <p class="mt-2 text-sm text-slate-400">{{ $description }}</p>
        @if ($videos->isEmpty())
            <p class="mt-4 text-sm text-slate-400">Prueba con otro tag o vuelve pronto para nuevos resultados.</p>
        @endif
    </section>

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">No hay videos para este tag.</p>
        @endforelse
    </x-video-grid>

    <div class="mt-6">
        {{ $videos->links() }}
    </div>
</x-layouts.public>
