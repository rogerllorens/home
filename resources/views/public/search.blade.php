@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit('Search | Candid Boys', $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit('Search videos and tags on Candid Boys.', $descMax, '');
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
        <form class="mt-4 flex flex-col gap-3 sm:flex-row" method="GET" action="{{ route('public.search') }}">
            <label class="sr-only" for="search-query">{{ __('ui.forms.search_placeholder') }}</label>
            <input
                id="search-query"
                name="q"
                type="search"
                value="{{ $query }}"
                placeholder="{{ __('ui.forms.search_placeholder') }}"
                class="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
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
