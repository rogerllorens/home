@php
    $brand = config('app.name', __('ui.brand'));
    $collectionName = $collection->name ?? __('ui.meta.collection_title_fallback');
    $pageTitle = __('ui.meta.title_with_brand', ['title' => $collectionName, 'brand' => $brand]);
    $pageDescription = $collection->description ?: __('ui.meta.collection_description_fallback', ['collection' => $collectionName]);
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
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
        <h1 class="text-2xl font-semibold text-white">{{ $collection->name }}</h1>
        <p class="mt-2 text-sm text-slate-300">{{ $pageDescription }}</p>
    </section>

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">{{ __('ui.empty.no_videos_collection') }}</p>
        @endforelse
    </x-video-grid>
</x-layouts.public>
