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
        <x-schema.item-list :videos="$latestVideos" />
    @endpush

    <div class="mb-8">
        <x-ad-slot slot-name="home_top" />
    </div>

    <section class="mb-8 rounded-xl border border-red-600/40 bg-black/80 p-5 md:p-6">
        <div class="grid gap-6 lg:grid-cols-[1.1fr,1fr] lg:items-center">
            <div class="space-y-5">
                <p class="text-xs uppercase tracking-[0.3em] text-red-300">Candid Boys</p>
                <h1 class="text-3xl font-semibold text-white md:text-4xl">Encuentra videos que te enganchan al instante</h1>
                <p class="text-sm text-slate-300 md:text-base">{!! $linkedHeroIntro ?? '' !!}</p>
                <form class="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:flex-row sm:items-center" method="GET" action="{{ route('public.search') }}">
                    <label class="sr-only" for="hero-search">Buscar</label>
                    <div class="flex w-full items-center gap-2 rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-sm text-slate-200">
                        <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input id="hero-search" name="q" type="search" placeholder="Buscar categorías, tags o vídeos" class="w-full bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none" />
                    </div>
                    <button class="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" type="submit">
                        Explorar
                    </button>
                </form>
                <div class="flex flex-wrap gap-2 text-xs text-slate-200">
                    @foreach (config('candidboys.categories_controlled', []) as $slug)
                        <a class="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-semibold text-slate-100 hover:border-red-400/60" href="{{ route('public.category', $slug) }}">
                            {{ \Illuminate\Support\Str::headline($slug) }}
                        </a>
                    @endforeach
                </div>
                <div class="flex flex-wrap gap-3">
                    <a class="rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ $heroPrimary ? route('public.video', ['slug' => \Illuminate\Support\Str::slug($heroPrimary->seo_title ?: $heroPrimary->title), 'id' => $heroPrimary->id]) : '#latest-videos' }}">
                        Ver destacado
                    </a>
                    <a class="rounded-md border border-red-500/60 px-4 py-2.5 text-sm font-semibold text-red-100 hover:border-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="#latest-videos">
                        Explorar catálogo
                    </a>
                </div>
                <div class="text-xs text-slate-400">
                    Selecciones diarias • Preview rápido • Navegación sin ruido
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
            <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-300" role="group" aria-label="Sort videos">
                <span class="pr-2 font-semibold text-slate-200">Ordenar</span>
                @foreach ($filters as $key => $label)
                    <a
                        class="rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeSort === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                        href="{{ route('public.home', ['sort' => $key, 'duration' => $activeDuration]) }}"
                        aria-current="{{ $activeSort === $key ? 'true' : 'false' }}"
                    >
                        {{ $label }}
                    </a>
                @endforeach
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-300" role="group" aria-label="Filter by duration">
                <span class="pr-2 font-semibold text-slate-200">Duración</span>
                @foreach ($durationFilters as $key => $label)
                    <a
                        class="rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeDuration === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                        href="{{ route('public.home', ['sort' => $activeSort, 'duration' => $key]) }}"
                        aria-current="{{ $activeDuration === $key ? 'true' : 'false' }}"
                    >
                        {{ $label }}
                    </a>
                @endforeach
                @if ($activeDuration)
                    <a
                        class="rounded-full px-4 py-2 text-[13px] font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        href="{{ route('public.home', ['sort' => $activeSort]) }}"
                    >
                        Clear
                    </a>
                @endif
            </div>
            @if ($popularTags->isNotEmpty())
                <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-300" role="group" aria-label="Popular tags">
                    <span class="pr-2 font-semibold text-slate-200">Tags top</span>
                    @foreach ($popularTags as $tag)
                        <a class="rounded-full bg-white/5 px-4 py-2 text-[13px] font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.tag', $tag->tag) }}">
                            #{{ $tag->tag }}
                        </a>
                    @endforeach
                </div>
            @endif
        </div>
    </section>

    <section class="mb-10 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-slate-950 to-slate-950 p-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <p class="text-xs uppercase tracking-[0.3em] text-indigo-300">Reels destacados</p>
                <h2 class="mt-2 text-xl font-semibold text-white">Clips cortos para descubrir rápido</h2>
                <p class="mt-2 text-sm text-slate-300">Explora el feed de reels curado con lo más dinámico del día.</p>
            </div>
            <a class="inline-flex items-center justify-center rounded-full bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.reels') }}">
                Ver reels
            </a>
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

    @if ($favoriteVideos->isNotEmpty())
        <section class="mb-10">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">From your favorites</h2>
                <span class="text-xs text-slate-400">Tus favoritos más recientes.</span>
            </div>
            <x-video-grid>
                @foreach ($favoriteVideos as $video)
                    <x-video-card :video="$video" />
                @endforeach
            </x-video-grid>
        </section>
    @endif

    @if ($recommendedVideos->isNotEmpty())
        <section class="mb-10">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="text-lg font-semibold text-white">{{ __('ui.sections.recommended') }}</h2>
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
