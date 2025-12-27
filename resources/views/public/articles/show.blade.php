@php
    $brand = config('app.name', __('ui.brand'));
    $articleTitle = $article['title'] ?? __('ui.articles.fallback_title');
    $pageTitle = __('ui.meta.title_with_brand', ['title' => $articleTitle, 'brand' => $brand]);
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $article['summary'] ?? '' }}"
            canonical="{{ url()->current() }}"
        />
    @endpush

    <section class="space-y-6">
        <div class="rounded-xl border border-white/10 bg-white/5 p-6">
            <h1 class="text-3xl font-semibold text-white">{{ $article['title'] }}</h1>
            <p class="mt-3 text-sm text-slate-300">{{ $article['summary'] }}</p>
        </div>

        <div class="space-y-4 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ __('ui.legal.placeholder_notice') }}</p>
            <p>{{ __('ui.legal.placeholder_copy') }}</p>
            @foreach ($article['sections'] ?? [] as $section)
                <div>
                    <h2 class="text-base font-semibold text-white">{{ $section['title'] }}</h2>
                    <p class="mt-2">{{ $section['body'] }}</p>
                </div>
            @endforeach
        </div>
    </section>
</x-layouts.public>
