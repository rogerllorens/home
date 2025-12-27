@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = \Illuminate\Support\Str::limit(__('ui.meta.title_with_brand', ['title' => $heading, 'brand' => $brand]), $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit($description, $descMax, '');
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
        <p class="mt-2 text-sm text-slate-400">{{ __('ui.category.helper') }}</p>
        @if ($videos->isEmpty())
            <p class="mt-4 text-sm text-slate-400">{{ __('ui.category.empty') }}</p>
            <a class="mt-3 inline-flex rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500" href="{{ route('public.home') }}">
                {{ __('ui.category.browse_latest') }}
            </a>
        @endif
    </section>

    <h2 class="mb-3 text-lg font-semibold text-white">{{ __('ui.category.videos_in', ['category' => $heading]) }}</h2>
    <div class="mb-4 space-y-2">
        <div class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-300" role="group" aria-label="{{ __('ui.filters.sort_results_label') }}">
            <span class="pr-2 font-semibold text-slate-200">{{ __('ui.filters.sort_results_label') }}</span>
            @foreach ($filters as $key => $label)
                <a
                    class="rounded-full px-3 py-1 text-[12px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $activeSort === $key ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-200 hover:bg-white/10' }}"
                    href="{{ route('public.category', array_merge(request()->query(), ['category_slug' => $categorySlug, 'sort' => $key])) }}"
                    data-track-event="filter.apply"
                    data-track-filter="sort"
                    data-track-value="{{ $key }}"
                    data-track-context="category"
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
                    href="{{ route('public.category', array_merge(request()->query(), ['category_slug' => $categorySlug, 'duration' => $key])) }}"
                    data-track-event="filter.apply"
                    data-track-filter="duration"
                    data-track-value="{{ $key }}"
                    data-track-context="category"
                >
                    {{ $label }}
                </a>
            @endforeach
            @if ($activeDuration)
                <a
                    class="rounded-full px-3 py-1 text-[12px] font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    href="{{ route('public.category', array_merge(request()->query(), ['category_slug' => $categorySlug, 'duration' => null])) }}"
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
                    href="{{ route('public.category', array_merge(request()->query(), ['category_slug' => $categorySlug, 'date' => $key])) }}"
                    data-track-event="filter.apply"
                    data-track-filter="date"
                    data-track-value="{{ $key }}"
                    data-track-context="category"
                >
                    {{ $label }}
                </a>
            @endforeach
        </div>
    </div>
    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" :show-category="false" />
        @empty
            <p class="text-sm text-slate-400">{{ __('ui.category.no_videos') }}</p>
        @endforelse
    </x-video-grid>

    <div class="mt-6 rounded-md border border-white/10 bg-white/5 px-4 py-3">
        {{ $videos->links() }}
    </div>

    @php
        $categoryParagraphs = (array) __('seo.category.paragraphs', [
            'category' => $heading,
            'description' => $description,
        ]);
        $categoryFaqs = (array) __('seo.category.faq', [
            'category' => $heading,
            'description' => $description,
        ]);
    @endphp

    <section class="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 px-6 py-6 text-sm text-slate-300">
        <h2 class="text-lg font-semibold text-white">{{ __('seo.category.heading', ['category' => $heading]) }}</h2>
        <div class="mt-3 space-y-3">
            @foreach ($categoryParagraphs as $paragraph)
                <p>{{ $paragraph }}</p>
            @endforeach
        </div>
        @if (!empty($categoryFaqs))
            <div class="mt-6 space-y-3">
                <h3 class="text-base font-semibold text-white">{{ __('seo.category.faq_heading') }}</h3>
                <div class="space-y-3">
                    @foreach ($categoryFaqs as $faq)
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
