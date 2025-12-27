@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = \Illuminate\Support\Str::limit(__('ui.meta.search_title', ['brand' => $brand]), $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit(__('ui.meta.search_description', ['brand' => $brand]), $descMax, '');
    $filters = [
        'recent' => __('ui.filters.sort_recent'),
        'popular' => __('ui.filters.sort_popular'),
    ];
    $durationFilters = [
        'short' => __('ui.filters.duration_short_label'),
        'medium' => __('ui.filters.duration_medium_label'),
        'long' => __('ui.filters.duration_long_label'),
    ];
    $dateFilters = [
        '24h' => __('ui.filters.date_24h_short'),
        'week' => __('ui.filters.date_week_short'),
        'month' => __('ui.filters.date_month_short'),
        'all' => __('ui.filters.date_all_short'),
    ];
    $activeSort = $sort ?? 'recent';
    $activeDuration = $duration ?? null;
    $activeDate = $date ?? 'all';
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ route('public.search') }}"
            robots="noindex,follow"
        />
    @endpush
    <section class="mb-8">
        <h1 class="text-2xl font-semibold">{{ __('ui.forms.search_title') }}</h1>
        <form class="mt-4 flex flex-col gap-3 sm:flex-row" method="GET" action="{{ route('public.search') }}" data-track-submit="search.submit" data-track-context="search_page">
            <label class="sr-only" for="search-query">{{ __('ui.forms.search_placeholder') }}</label>
            <input type="hidden" name="duration" value="{{ $activeDuration }}">
            <input type="hidden" name="date" value="{{ $activeDate }}">
            <input type="hidden" name="sort" value="{{ $activeSort }}">
            <div class="relative w-full" data-suggestions-wrapper>
                <input
                    id="search-query"
                    name="q"
                    type="search"
                    value="{{ $query }}"
                    placeholder="{{ __('ui.forms.search_placeholder') }}"
                    class="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-400"
                    autocomplete="off"
                    data-search-autocomplete
                    data-suggestions-url="{{ route('public.search.suggestions') }}"
                />
                <div class="absolute inset-x-0 top-full z-30 mt-2 hidden rounded-xl border border-white/10 bg-slate-950/95 p-2 text-sm text-slate-200 shadow-xl" data-suggestions-list></div>
            </div>
            <button class="inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" type="submit">
                {{ __('ui.buttons.search') }}
            </button>
        </form>
        @if ($query)
            <p class="mt-3 text-sm text-slate-400">{{ __('ui.forms.search_results', ['query' => $query]) }}</p>
        @else
            <p class="mt-3 text-sm text-slate-400">{{ __('ui.forms.search_hint') }}</p>
        @endif
    </section>

    <div class="mb-4 space-y-2">
        <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-300" role="group" aria-label="{{ __('ui.filters.sort_results_label') }}">
            <span class="pr-2 font-semibold text-slate-200">{{ __('ui.filters.sort_results_label') }}</span>
            @foreach ($filters as $key => $label)
                <a
                    class="rounded-full px-3 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeSort === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                    href="{{ route('public.search', array_merge(request()->query(), ['sort' => $key])) }}"
                    data-track-event="filter.apply"
                    data-track-filter="sort"
                    data-track-value="{{ $key }}"
                    data-track-context="search"
                >
                    {{ $label }}
                </a>
            @endforeach
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-300" role="group" aria-label="{{ __('ui.filters.duration_results_label') }}">
            <span class="pr-2 font-semibold text-slate-200">{{ __('ui.filters.duration_results_label') }}</span>
            @foreach ($durationFilters as $key => $label)
                <a
                    class="rounded-full px-3 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeDuration === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                    href="{{ route('public.search', array_merge(request()->query(), ['duration' => $key])) }}"
                    data-track-event="filter.apply"
                    data-track-filter="duration"
                    data-track-value="{{ $key }}"
                    data-track-context="search"
                >
                    {{ $label }}
                </a>
            @endforeach
            @if ($activeDuration)
                <a
                    class="rounded-full px-3 py-1 text-[12px] font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    href="{{ route('public.search', array_merge(request()->query(), ['duration' => null])) }}"
                >
                    {{ __('ui.filters.clear') }}
                </a>
            @endif
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-300" role="group" aria-label="{{ __('ui.filters.date_results_label') }}">
            <span class="pr-2 font-semibold text-slate-200">{{ __('ui.filters.date_results_label') }}</span>
            @foreach ($dateFilters as $key => $label)
                <a
                    class="rounded-full px-3 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeDate === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                    href="{{ route('public.search', array_merge(request()->query(), ['date' => $key])) }}"
                    data-track-event="filter.apply"
                    data-track-filter="date"
                    data-track-value="{{ $key }}"
                    data-track-context="search"
                >
                    {{ $label }}
                </a>
            @endforeach
        </div>
    </div>

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">
                {{ $query ? __('ui.search.no_results') : __('ui.search.start_typing') }}
            </p>
        @endforelse
    </x-video-grid>

    @if ($resultsCount === 0 && ($searchSuggestions || $categorySuggestion || $tagSuggestion))
        <div class="mt-6 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <p class="font-semibold text-white">{{ __('ui.search.did_you_mean') }}</p>
            <div class="mt-2 flex flex-wrap gap-2">
                @foreach ($searchSuggestions as $suggestion)
                    <a class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/20" href="{{ route('public.search', ['q' => $suggestion]) }}">
                        {{ $suggestion }}
                    </a>
                @endforeach
                @if ($categorySuggestion)
                    <a class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/20" href="{{ route('public.category', $categorySuggestion) }}">
                        {{ __('ui.search.category_link', ['query' => $categorySuggestion]) }}
                    </a>
                @endif
                @if ($tagSuggestion)
                    <a class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/20" href="{{ route('public.tag', $tagSuggestion) }}">
                        {{ __('ui.search.tag_link', ['query' => $tagSuggestion]) }}
                    </a>
                @endif
            </div>
        </div>
    @endif

    <div class="mt-6 rounded-md border border-white/10 bg-white/5 px-4 py-3">
        {{ $videos->links() }}
    </div>
</x-layouts.public>
