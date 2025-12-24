@php
    $filters = [
        'recent' => 'Most Recent',
        'views' => 'Most Viewed',
        'longest' => 'Longest',
    ];
    $activeSort = $sort ?? 'recent';
@endphp

<x-layouts.public title="Candid Boys | Home">
    @push('head')
        <meta name="description" content="Discover the latest and most popular videos with a fast, classic tube-style browsing experience.">
        <link rel="canonical" href="{{ url('/') }}">
        <script type="application/ld+json" nonce="{{ $cspNonce ?? '' }}">
            {!! json_encode([
                '@context' => 'https://schema.org',
                '@type' => 'ItemList',
                'itemListElement' => $latestVideos->map(function ($video, $index) {
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

    @if ($featured)
        @php
            $featuredThumbnail = $featured->thumbnail_url ?: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
        @endphp
        <section class="mb-8">
            <div class="rounded-lg border border-red-600/40 bg-black/80 p-4 md:flex md:items-center md:gap-6">
                <a class="block md:w-2/3" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($featured->seo_title ?: $featured->title), 'id' => $featured->id]) }}">
                    <div class="relative overflow-hidden rounded-md bg-black">
                        <div class="aspect-video w-full">
                            <img
                                src="{{ $featuredThumbnail }}"
                                alt="{{ $featured->title }}"
                                class="h-full w-full object-cover"
                                loading="eager"
                                decoding="async"
                                fetchpriority="high"
                            />
                        </div>
                        @if ($featured->duration_seconds)
                            <span class="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-xs font-semibold text-white">
                                {{ $featured->duration_seconds >= 3600 ? gmdate('H:i:s', $featured->duration_seconds) : gmdate('i:s', $featured->duration_seconds) }}
                            </span>
                        @endif
                    </div>
                </a>
                <div class="mt-4 space-y-3 md:mt-0 md:w-1/3">
                    <h1 class="text-xl font-semibold text-white md:text-2xl">
                        {{ $featured->title }}
                    </h1>
                    <div class="flex flex-wrap gap-3">
                        <a class="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($featured->seo_title ?: $featured->title), 'id' => $featured->id]) }}">
                            Watch now
                        </a>
                        @if ($featured->category_slug)
                            <a class="rounded-md border border-red-500/60 px-4 py-2 text-sm font-semibold text-red-100 hover:border-red-400" href="{{ route('public.category', $featured->category_slug) }}">
                                View category
                            </a>
                        @endif
                    </div>
                </div>
            </div>
        </section>
    @else
        <section class="mb-6">
            <h1 class="text-2xl font-semibold text-white">Latest videos</h1>
        </section>
    @endif

    <section class="mb-8">
        <div class="flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-black/60 px-3 py-2 text-xs uppercase tracking-wide text-slate-300">
            @foreach ($filters as $key => $label)
                <a
                    class="rounded-md px-3 py-1 font-semibold {{ $activeSort === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10' }}"
                    href="{{ route('public.home', ['sort' => $key]) }}"
                >
                    {{ $label }}
                </a>
            @endforeach
        </div>
    </section>

    @foreach ($categorySections as $slug => $videos)
        <section class="mb-10">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">{{ \Illuminate\Support\Str::headline($slug) }}</h2>
                <a class="text-sm font-semibold text-red-400 hover:text-red-300" href="{{ route('public.category', $slug) }}">
                    View all
                </a>
            </div>
            <x-video-grid>
                @foreach ($videos as $video)
                    <x-video-card :video="$video" />
                @endforeach
            </x-video-grid>
        </section>
    @endforeach

    <section>
        <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">Latest videos</h2>
        </div>
        <x-video-grid>
            @forelse ($latestVideos as $video)
                <x-video-card :video="$video" />
            @empty
                <p class="text-sm text-slate-400">No videos available right now.</p>
            @endforelse
        </x-video-grid>

        <div class="mt-6">
            {{ $latestVideos->links() }}
        </div>
    </section>
</x-layouts.public>
