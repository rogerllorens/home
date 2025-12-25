@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit($heading . ' | Candid Boys', $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit($description, $descMax, '');
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

    <section class="mb-8">
        <h1 class="text-2xl font-semibold">Tag: {{ $heading }}</h1>
        <p class="mt-2 text-sm text-slate-400">{{ $description }}</p>
        @if ($videos->isEmpty())
            <p class="mt-4 text-sm text-slate-400">Try another tag or check back soon for new results.</p>
            <a class="mt-3 inline-flex rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500" href="{{ route('public.home') }}">
                Browse latest
            </a>
        @endif
    </section>

    <h2 class="mb-3 text-lg font-semibold text-white">Videos tagged {{ $heading }}</h2>
    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">No videos for this tag.</p>
        @endforelse
    </x-video-grid>

    <div class="mt-6">
        {{ $videos->links() }}
    </div>
</x-layouts.public>
