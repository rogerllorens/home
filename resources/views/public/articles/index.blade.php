@php
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = __('ui.meta.articles_title', ['brand' => $brand]);
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ __('ui.meta.articles_description', ['brand' => $brand]) }}"
            canonical="{{ route('public.articles') }}"
        />
    @endpush

    <section class="space-y-6">
        <div class="rounded-xl border border-white/10 bg-white/5 p-6">
            <h1 class="text-3xl font-semibold text-white">{{ __('ui.articles.title') }}</h1>
            <p class="mt-3 text-sm text-slate-300">{{ __('ui.articles.intro') }}</p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
            @foreach ($articles as $article)
                <a class="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-red-500/60 hover:bg-white/10" href="{{ route('public.articles.show', $article['slug']) }}">
                    <h2 class="text-lg font-semibold text-white">{{ $article['title'] }}</h2>
                    <p class="mt-2 text-sm text-slate-300">{{ $article['summary'] }}</p>
                    <span class="mt-3 inline-flex text-xs text-red-300">{{ __('ui.articles.read') }}</span>
                </a>
            @endforeach
        </div>
    </section>
</x-layouts.public>
