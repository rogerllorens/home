@php
    $filters = [
        'recent' => 'Most recent',
        'views' => 'Most viewed',
        'longest' => 'Longest',
    ];
    $activeSort = $sort ?? 'recent';
    $durationFilters = [
        'short' => 'Short (≤ 5 min)',
        'medium' => 'Medium (5–15 min)',
        'long' => 'Long (15+ min)',
    ];
    $activeDuration = $duration ?? null;
    $heroPrimary = $heroVideos->first();
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit('Candid Boys | Home', $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit('Discover the latest and most popular videos with a fast, clear browsing experience.', $descMax, '');
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ url('/') }}"
        />
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

    <div class="mb-8">
        <x-ad-slot slot-name="home_top" />
    </div>

    <section class="mb-8 rounded-xl border border-red-600/40 bg-black/80 p-5 md:p-6">
        <div class="grid gap-6 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <div class="space-y-5">
                <p class="text-xs uppercase tracking-[0.3em] text-red-300">Candid Boys</p>
                <h1 class="text-3xl font-semibold text-white md:text-4xl">Candid Boys</h1>
                <p class="text-sm text-slate-300 md:text-base">{{ __('ui.home.hero_intro', [], app()->getLocale()) ?? '' }}</p>
                <div class="flex flex-wrap gap-3">
                    <a class="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ $heroPrimary ? route('public.video', ['slug' => \Illuminate\Support\Str::slug($heroPrimary->seo_title ?: $heroPrimary->title), 'id' => $heroPrimary->id]) : '#latest-videos' }}">
                        {{ __('ui.buttons.watch_featured') }}
                    </a>
                    <a class="rounded-md border border-red-500/60 px-4 py-2.5 text-sm font-semibold text-red-100 hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="#latest-videos">
                        {{ __('ui.buttons.browse_all') }}
                    </a>
                </div>
                <div class="text-xs text-slate-400">
                    Featured picks updated daily • Fast previews • No clutter
                </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
                @forelse ($heroVideos as $heroVideo)
                    <x-video-card :video="$heroVideo" variant="hero" />
                @empty
                    <div class="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        New videos are on the way. Check back soon.
                    </div>
                @endforelse
            </div>
        </div>
    </section>

    <section class="mb-8">
        <div class="space-y-4">
            <div class="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-2 text-xs uppercase tracking-wide text-slate-300 md:mx-0 md:overflow-visible md:px-0" role="group" aria-label="Sort videos">
                <span class="pr-2 font-semibold text-slate-200">Sort by</span>
                @foreach ($filters as $key => $label)
                    <a
                        class="whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeSort === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                        href="{{ route('public.home', ['sort' => $key, 'duration' => $activeDuration]) }}"
                        aria-current="{{ $activeSort === $key ? 'true' : 'false' }}"
                    >
                        {{ $label }}
                    </a>
                @endforeach
            </div>
            <div class="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-2 text-xs uppercase tracking-wide text-slate-300 md:mx-0 md:overflow-visible md:px-0" role="group" aria-label="Filter by duration">
                <span class="pr-2 font-semibold text-slate-200">Duration</span>
                @foreach ($durationFilters as $key => $label)
                    <a
                        class="whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeDuration === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                        href="{{ route('public.home', ['sort' => $activeSort, 'duration' => $key]) }}"
                        aria-current="{{ $activeDuration === $key ? 'true' : 'false' }}"
                    >
                        {{ $label }}
                    </a>
                @endforeach
                @if ($activeDuration)
                    <a
                        class="whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        href="{{ route('public.home', ['sort' => $activeSort]) }}"
                    >
                        Clear
                    </a>
                @endif
            </div>
            @if ($popularTags->isNotEmpty())
                <div class="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-2 text-xs uppercase tracking-wide text-slate-300 md:mx-0 md:overflow-visible md:px-0" role="group" aria-label="Popular tags">
                    <span class="pr-2 font-semibold text-slate-200">Popular tags</span>
                    @foreach ($popularTags as $tag)
                        <a class="whitespace-nowrap rounded-full bg-white/5 px-4 py-2 text-[13px] font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.tag', $tag->tag) }}">
                            #{{ $tag->tag }}
                        </a>
                    @endforeach
                </div>
            @endif
        </div>
    </section>

    @if ($continueWatching->isNotEmpty())
        <section class="mb-10">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">{{ __('ui.sections.continue') }}</h2>
                <span class="text-xs text-slate-400">{{ __('ui.home.continue_subtitle') }}</span>
            </div>
            <x-video-grid>
                @foreach ($continueWatching as $video)
                    <x-video-card :video="$video" />
                @endforeach
            </x-video-grid>
        </section>
    @endif

    @if ($recommendedVideos->isNotEmpty())
        <section class="mb-10">
            <div class="mb-3 flex items-center justify-between">
                <h1 class="text-lg font-semibold text-white">{{ __('ui.sections.recommended') }}</h1>
                <span class="text-xs text-slate-400">{{ __('ui.home.recommended_subtitle') }}</span>
            </div>
            <x-video-grid>
                @foreach ($recommendedVideos as $video)
                    <x-video-card :video="$video" />
                @endforeach
            </x-video-grid>
        </section>
    @endif

    @if ($trendingVideos->isNotEmpty())
        <section class="mb-10">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">{{ __('ui.sections.trending') }}</h2>
                <span class="text-xs text-slate-400">{{ __('ui.home.trending_subtitle') }}</span>
            </div>
            <x-video-grid>
                @foreach ($trendingVideos as $video)
                    <x-video-card :video="$video" />
                @endforeach
            </x-video-grid>
        </section>
    @endif

    @if ($newThisWeek->isNotEmpty())
        <section class="mb-10">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">{{ __('ui.sections.new_week') }}</h2>
                <span class="text-xs text-slate-400">{{ __('ui.home.new_subtitle') }}</span>
            </div>
            <x-video-grid>
                @foreach ($newThisWeek as $video)
                    <x-video-card :video="$video" />
                @endforeach
            </x-video-grid>
        </section>
    @endif

    @if ($featuredCollections->isNotEmpty())
        <section class="mb-10">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">{{ __('ui.collections.featured') }}</h2>
                <a class="text-sm font-semibold text-red-400 hover:text-red-300" href="{{ route('public.collections.index') }}">
                    {{ __('ui.buttons.view_all') }}
                </a>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
                @foreach ($featuredCollections as $collection)
                    <a class="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-red-500/60 hover:bg-white/10" href="{{ route('public.collections.show', $collection->slug) }}">
                        <h3 class="text-lg font-semibold text-white">{{ $collection->name }}</h3>
                        <p class="mt-2 text-sm text-slate-300">{{ \Illuminate\Support\Str::limit($collection->description, 140) }}</p>
                    </a>
                @endforeach
            </div>
        </section>
    @endif

    <div class="mb-10">
        <x-ad-slot slot-name="home_between_sections" />
    </div>

    @foreach ($categorySections as $slug => $videos)
        <section class="mb-10">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">{{ \Illuminate\Support\Str::headline($slug) }}</h2>
                <a class="text-sm font-semibold text-red-400 hover:text-red-300" href="{{ route('public.category', $slug) }}">
                    {{ __('ui.buttons.view_all') }}
                </a>
            </div>
            <x-video-grid>
                @foreach ($videos as $video)
                    <x-video-card :video="$video" />
                @endforeach
            </x-video-grid>
        </section>
    @endforeach

    <section id="latest-videos" class="scroll-mt-20">
        <div class="mb-3 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-white">{{ __('ui.sections.latest') }}</h2>
        </div>
        <x-video-grid>
            @forelse ($latestVideos as $video)
                <x-video-card :video="$video" />
            @empty
                <div class="space-y-3">
                    <p class="text-sm text-slate-400">No videos available right now.</p>
                    <a class="inline-flex rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500" href="{{ route('public.search') }}">
                        Browse videos
                    </a>
                </div>
            @endforelse
        </x-video-grid>

        <div class="mt-6 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide text-slate-400">
                <span>Pagination</span>
                <span class="text-[11px] text-slate-500">Page {{ $latestVideos->currentPage() }} of {{ $latestVideos->lastPage() }}</span>
            </div>
            <div class="mt-3">
                {{ $latestVideos->links() }}
            </div>
        </div>
    </section>
</x-layouts.public>

@push('head')
    <script nonce="{{ $cspNonce ?? '' }}">
        document.addEventListener('DOMContentLoaded', () => {
            const storageKey = 'continue_watching';
            const ids = JSON.parse(localStorage.getItem(storageKey) || '[]');
            if (!Array.isArray(ids) || ids.length === 0) return;

            const url = new URL(window.location.href);
            if (url.searchParams.has('continue_ids')) return;

            const requested = ids.slice(0, 10).join(',');
            if (requested.length === 0) return;

            const sessionKey = 'continue_loaded';
            if (sessionStorage.getItem(sessionKey)) return;

            sessionStorage.setItem(sessionKey, '1');
            url.searchParams.set('continue_ids', requested);
            window.location.replace(url.toString());
        });
    </script>
@endpush
