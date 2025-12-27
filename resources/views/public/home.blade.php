@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = \Illuminate\Support\Str::limit(__('ui.meta.home_title', ['brand' => $brand]), $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit(__('ui.meta.home_description', ['brand' => $brand]), $descMax, '');
    $heroPrimary = $heroVideos->first();
    $filters = [
        'recent' => __('ui.filters.sort_recent'),
        'views' => __('ui.filters.sort_views'),
    ];
    $activeSort = $sort ?? 'recent';
    $durationFilters = [
        'short' => __('ui.filters.duration_short'),
        'medium' => __('ui.filters.duration_medium'),
        'long' => __('ui.filters.duration_long'),
    ];
    $activeDuration = $duration ?? null;
    $dateFilters = [
        '24h' => __('ui.filters.date_24h'),
        'week' => __('ui.filters.date_week'),
        'month' => __('ui.filters.date_month'),
        'all' => __('ui.filters.date_all'),
    ];
    $activeDate = $date ?? 'all';
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ route('public.home') }}"
        />
        <script type="application/ld+json" nonce="{{ $cspNonce ?? '' }}">
            {!! json_encode([
                '@context' => 'https://schema.org',
                '@type' => 'ItemList',
                'itemListElement' => $recentlyAddedVideos->map(function ($video, $index) {
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

    @feature('home_hero_variant', 'B')
    <section class="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-black via-slate-950 to-slate-900 px-6 py-10 sm:px-10">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_55%)]"></div>
        <div class="relative grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div class="space-y-6">
                <p class="text-xs uppercase tracking-[0.35em] text-indigo-300">{{ __('ui.home.hero_label') }}</p>
                <h1 class="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">{{ __('ui.home.hero_title_a') }}</h1>
                <p class="text-sm text-slate-200 sm:text-base">{{ __('ui.home.hero_body_a') }}</p>
                <form class="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg shadow-black/30" method="GET" action="{{ route('public.search') }}" data-track-submit="search.submit" data-track-context="home_hero">
                    <label class="sr-only" for="hero-search">{{ __('ui.home.hero_search_label') }}</label>
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div class="relative w-full" data-suggestions-wrapper>
                            <div class="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                                <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <circle cx="11" cy="11" r="7" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    id="hero-search"
                                    name="q"
                                    type="search"
                                    placeholder="{{ __('ui.home.hero_search_placeholder') }}"
                                    class="w-full bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
                                    autocomplete="off"
                                    data-search-autocomplete
                                    data-suggestions-url="{{ route('public.search.suggestions') }}"
                                />
                            </div>
                            <div class="absolute inset-x-0 top-full z-30 mt-2 hidden rounded-xl border border-white/10 bg-slate-950/95 p-2 text-sm text-slate-200 shadow-xl" data-suggestions-list></div>
                        </div>
                        <button
                            class="inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
                            type="submit"
                        >
                            {{ __('ui.home.hero_search_button') }}
                        </button>
                    </div>
                </form>
                <div class="space-y-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ __('ui.home.hero_quick_picks') }}</p>
                    <div class="flex flex-wrap gap-2">
                        @foreach ($quickCategories as $category)
                            <a class="rounded-full border border-indigo-500/50 px-3 py-1 text-xs font-semibold text-indigo-100 hover:border-indigo-400 hover:text-white" href="{{ route('public.category', $category['slug']) }}">
                                {{ $category['label'] }}
                            </a>
                        @endforeach
                        @foreach ($quickTags as $tag)
                            <a class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-white/20" href="{{ route('public.tag', $tag->tag) }}">
                                #{{ $tag->tag }}
                            </a>
                        @endforeach
                    </div>
                </div>
                <div class="flex flex-wrap gap-3 text-xs text-slate-400">
                    @foreach ((array) __('ui.home.hero_highlights_a') as $index => $highlight)
                        <span>{{ $highlight }}</span>
                        @if (!$loop->last)
                            <span>•</span>
                        @endif
                    @endforeach
                </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
                @forelse ($heroVideos as $heroVideo)
                    <x-video-card :video="$heroVideo" variant="hero" />
                @empty
                    <div class="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        {{ __('ui.home.hero_empty') }}
                    </div>
                @endforelse
            </div>
        </div>
    </section>
@else
    <section class="relative overflow-hidden rounded-2xl border border-red-600/30 bg-gradient-to-br from-black via-slate-950 to-slate-900 px-6 py-10 sm:px-10">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.18),_transparent_55%)]"></div>
        <div class="relative grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
            <div class="space-y-6">
                <p class="text-xs uppercase tracking-[0.35em] text-red-300">{{ __('ui.home.hero_label') }}</p>
                <h1 class="text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">{{ __('ui.home.hero_title_b') }}</h1>
                <p class="text-sm text-slate-200 sm:text-base">{{ __('ui.home.hero_body_b') }}</p>
                <form class="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg shadow-black/30" method="GET" action="{{ route('public.search') }}" data-track-submit="search.submit" data-track-context="home_hero">
                    <label class="sr-only" for="hero-search">{{ __('ui.home.hero_search_label') }}</label>
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div class="relative w-full" data-suggestions-wrapper>
                            <div class="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3">
                                <svg class="h-5 w-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <circle cx="11" cy="11" r="7" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                                <input
                                    id="hero-search"
                                    name="q"
                                    type="search"
                                    placeholder="{{ __('ui.home.hero_search_placeholder') }}"
                                    class="w-full bg-transparent text-base text-white placeholder:text-slate-500 focus:outline-none"
                                    autocomplete="off"
                                    data-search-autocomplete
                                    data-suggestions-url="{{ route('public.search.suggestions') }}"
                                />
                            </div>
                            <div class="absolute inset-x-0 top-full z-30 mt-2 hidden rounded-xl border border-white/10 bg-slate-950/95 p-2 text-sm text-slate-200 shadow-xl" data-suggestions-list></div>
                        </div>
                        <button
                            class="inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 sm:w-auto"
                            type="submit"
                        >
                            {{ __('ui.home.hero_search_button') }}
                        </button>
                    </div>
                </form>
                <div class="space-y-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ __('ui.home.hero_quick_picks') }}</p>
                    <div class="flex flex-wrap gap-2">
                        @foreach ($quickCategories as $category)
                            <a class="rounded-full border border-red-500/50 px-3 py-1 text-xs font-semibold text-red-100 hover:border-red-400 hover:text-white" href="{{ route('public.category', $category['slug']) }}">
                                {{ $category['label'] }}
                            </a>
                        @endforeach
                        @foreach ($quickTags as $tag)
                            <a class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-white/20" href="{{ route('public.tag', $tag->tag) }}">
                                #{{ $tag->tag }}
                            </a>
                        @endforeach
                    </div>
                </div>
                <div class="flex flex-wrap gap-3 text-xs text-slate-400">
                    @foreach ((array) __('ui.home.hero_highlights_b') as $index => $highlight)
                        <span>{{ $highlight }}</span>
                        @if (!$loop->last)
                            <span>•</span>
                        @endif
                    @endforeach
                </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
                @forelse ($heroVideos as $heroVideo)
                    <x-video-card :video="$heroVideo" variant="hero" />
                @empty
                    <div class="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                        {{ __('ui.home.hero_empty') }}
                    </div>
                @endforelse
            </div>
        </div>
    </section>

    <div class="my-8">
        <x-ad-slot slot-name="home_top" />
    </div>

    @if ($hasPersonalizedSections && $personalizedSections->isNotEmpty())
        @foreach ($personalizedSections as $section)
            <section class="mb-10" data-home-section="{{ $section['id'] }}">
                <div class="mb-4 space-y-1">
                    <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ __('ui.home.for_you_label') }}</p>
                    <h2 class="text-xl font-semibold text-white">{{ $section['title'] }}</h2>
                    @if (!empty($section['subtitle']))
                        <p class="text-sm text-slate-400">{{ $section['subtitle'] }}</p>
                    @endif
                </div>
                <x-video-grid>
                    @foreach ($section['videos'] as $video)
                        <x-video-card :video="$video" />
                    @endforeach
                </x-video-grid>
            </section>
        @endforeach
    @endif

    @if (!$hasPersonalizedSections && $continueWatching->isNotEmpty())
        <section class="mb-10">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-xl font-semibold text-white">{{ __('ui.home.continue_title') }}</h2>
            </div>
            <x-video-grid>
                @foreach ($continueWatching as $video)
                    <x-video-card :video="$video" />
                @endforeach
            </x-video-grid>
        </section>
    @endif

    @if (!$hasPersonalizedSections && $recommendedVideos->isNotEmpty())
        <section class="mb-10">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="text-xl font-semibold text-white">{{ __('ui.home.recommended_title') }}</h2>
                <a class="text-sm font-semibold text-slate-300 hover:text-white" href="{{ route('public.history') }}">{{ __('ui.links.view_history') }}</a>
            </div>
            <x-video-grid>
                @foreach ($recommendedVideos as $video)
                    <x-video-card :video="$video" />
                @endforeach
            </x-video-grid>
        </section>
    @endif

    <section class="mb-10" id="recently-added">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-white">{{ __('ui.home.recently_added') }}</h2>
            <a class="text-sm font-semibold text-red-300 hover:text-red-200" href="{{ route('public.home') }}">{{ __('ui.links.browse_all') }}</a>
        </div>
        <x-video-grid>
            @forelse ($recentlyAddedVideos as $video)
                <x-video-card :video="$video" />
            @empty
                <p class="text-sm text-slate-400">{{ __('ui.empty.no_videos') }}</p>
            @endforelse
        </x-video-grid>
    </section>

    <section class="mb-10">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-white">{{ __('ui.home.most_viewed') }}</h2>
            <a class="text-sm font-semibold text-slate-300 hover:text-white" href="{{ route('public.top.week') }}">{{ __('ui.links.top_week') }}</a>
        </div>
        <x-video-grid>
            @foreach ($mostViewedVideos as $video)
                <x-video-card :video="$video" />
            @endforeach
        </x-video-grid>
    </section>

    <section class="mb-10">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-white">{{ __('ui.home.trending_week') }}</h2>
            <a class="text-sm font-semibold text-slate-300 hover:text-white" href="{{ route('public.top.week') }}">{{ __('ui.links.see_all') }}</a>
        </div>
        <x-video-grid>
            @foreach ($trendingVideos as $video)
                <x-video-card :video="$video" />
            @endforeach
        </x-video-grid>
    </section>

    <section class="mb-10">
        <div class="mb-4 flex items-center justify-between">
            <div>
                <h2 class="text-xl font-semibold text-white">{{ __('ui.home.reels_title') }}</h2>
                <p class="text-sm text-slate-400">{{ __('ui.home.reels_description') }}</p>
            </div>
            <a class="text-sm font-semibold text-red-300 hover:text-red-200" href="{{ route('public.reels') }}">{{ __('ui.links.open_reels') }}</a>
        </div>
        <x-video-grid class="sm:grid-cols-3 lg:grid-cols-6">
            @foreach ($reelsVideos as $video)
                <x-video-card :video="$video" />
            @endforeach
        </x-video-grid>
    </section>

    <section class="mb-10">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-white">{{ __('ui.home.all_videos') }}</h2>
            <div class="text-xs uppercase tracking-wide text-slate-400">{{ __('ui.home.updated_daily') }}</div>
        </div>
        <div class="mb-4 space-y-2">
            <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-300" role="group" aria-label="{{ __('ui.filters.sort_label') }}">
                <span class="pr-2 font-semibold text-slate-200">{{ __('ui.filters.sort_label') }}</span>
                @foreach ($filters as $key => $label)
                    <a
                        class="rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeSort === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                        href="{{ route('public.home', ['sort' => $key, 'duration' => $activeDuration, 'date' => $activeDate]) }}"
                        aria-current="{{ $activeSort === $key ? 'true' : 'false' }}"
                        data-track-event="filter.apply"
                        data-track-filter="sort"
                        data-track-value="{{ $key }}"
                        data-track-context="home"
                    >
                        {{ $label }}
                    </a>
                @endforeach
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-300" role="group" aria-label="{{ __('ui.filters.duration_label') }}">
                <span class="pr-2 font-semibold text-slate-200">{{ __('ui.filters.duration_label') }}</span>
                @foreach ($durationFilters as $key => $label)
                    <a
                        class="rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeDuration === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                        href="{{ route('public.home', ['sort' => $activeSort, 'duration' => $key, 'date' => $activeDate]) }}"
                        aria-current="{{ $activeDuration === $key ? 'true' : 'false' }}"
                        data-track-event="filter.apply"
                        data-track-filter="duration"
                        data-track-value="{{ $key }}"
                        data-track-context="home"
                    >
                        {{ $label }}
                    </a>
                @endforeach
                @if ($activeDuration)
                    <a
                        class="rounded-full px-4 py-2 text-[13px] font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        href="{{ route('public.home', ['sort' => $activeSort, 'date' => $activeDate]) }}"
                    >
                        {{ __('ui.filters.clear') }}
                    </a>
                @endif
            </div>
            <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-300" role="group" aria-label="{{ __('ui.filters.date_label') }}">
                <span class="pr-2 font-semibold text-slate-200">{{ __('ui.filters.date_label') }}</span>
                @foreach ($dateFilters as $key => $label)
                    <a
                        class="rounded-full px-4 py-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeDate === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                        href="{{ route('public.home', ['sort' => $activeSort, 'duration' => $activeDuration, 'date' => $key]) }}"
                        aria-current="{{ $activeDate === $key ? 'true' : 'false' }}"
                        data-track-event="filter.apply"
                        data-track-filter="date"
                        data-track-value="{{ $key }}"
                        data-track-context="home"
                    >
                        {{ $label }}
                    </a>
                @endforeach
            </div>
        </div>
        <x-video-grid>
            @foreach ($latestVideos as $video)
                <x-video-card :video="$video" />
            @endforeach
        </x-video-grid>
        <div class="mt-6">
            {{ $latestVideos->links() }}
        </div>
    </section>

    <section class="rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-8">
        @php
            $homeParagraphs = (array) __('seo.home.paragraphs');
            $homeFaqs = (array) __('seo.home.faq');
        @endphp
        <div class="space-y-4 text-sm text-slate-300">
            <h2 class="text-xl font-semibold text-white">{{ __('seo.home.heading') }}</h2>
            @foreach ($homeParagraphs as $paragraph)
                <p>{{ $paragraph }}</p>
            @endforeach
        </div>
        @if (!empty($homeFaqs))
            <div class="mt-6 space-y-4">
                <h3 class="text-lg font-semibold text-white">{{ __('seo.home.faq_heading') }}</h3>
                <div class="space-y-3 text-sm text-slate-300">
                    @foreach ($homeFaqs as $faq)
                        <div>
                            <p class="font-semibold text-slate-100">{{ $faq['question'] ?? '' }}</p>
                            <p>{{ $faq['answer'] ?? '' }}</p>
                        </div>
                    @endforeach
                </div>
            </div>
        @endif
    </section>
</x-layouts.public>

@endfeature

@push('head')
    <script nonce="{{ $cspNonce ?? '' }}">
        document.addEventListener('DOMContentLoaded', () => {
            const variant = @json(app(\App\Services\FeatureFlags\FeatureFlagService::class)->variantFor(
                'home_hero_variant',
                \App\Support\DeviceHash::fromRequest(request()),
                'A'
            ));
            if (window.trackEvent) {
                window.trackEvent('experiment.view', {
                    experiment: 'home_hero_variant',
                    variant,
                });
            }
        });
    </script>
@endpush
