@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = \Illuminate\Support\Str::limit(__('ui.meta.title_with_brand', ['title' => $landing->title, 'brand' => $brand]), $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit($landing->description, $descMax, '');
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ route('public.discover', $landing->slug) }}"
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
        <h1 class="text-2xl font-semibold">{{ $landing->title }}</h1>
        <p class="mt-2 text-sm text-slate-400">{{ $landing->description }}</p>
    </section>

    @if ($landing->collection)
        <section class="mb-8 rounded-xl border border-white/10 bg-white/5 p-5">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs uppercase tracking-[0.2em] text-slate-400">{{ __('ui.discover.collection_label') }}</p>
                    <h2 class="text-lg font-semibold text-white">{{ $landing->collection->name }}</h2>
                </div>
                <a class="rounded-md border border-red-500/60 px-4 py-2 text-sm font-semibold text-red-100 hover:border-red-400" href="{{ route('public.collections.show', $landing->collection->slug) }}">
                    {{ __('ui.links.view_full_collection') }}
                </a>
            </div>
            <p class="mt-3 text-sm text-slate-300">{{ $landing->collection->description }}</p>
        </section>
    @endif

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">{{ __('ui.search.no_results') }}</p>
        @endforelse
    </x-video-grid>
</x-layouts.public>
