@php
    $pageTitle = ($article['title'] ?? 'Article') . ' | Candid Boys';
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $article['summary'] ?? '' }}"
            canonical="{{ url()->current() }}"
        />
        <x-schema.article :article="$article" :url="url()->current()" />
    @endpush

    <section class="space-y-6">
        <div class="rounded-xl border border-white/10 bg-white/5 p-6">
            <h1 class="text-3xl font-semibold text-white">{{ $article['title'] }}</h1>
            @if (!empty($article['image']))
                <img class="mt-3 w-full rounded-lg border border-white/10 object-cover" src="{{ $article['image'] }}" alt="{{ $article['title'] }}">
            @endif
            @if (!empty($article['is_discover_candidate']))
                <span class="mt-3 inline-flex rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-xs uppercase tracking-wide text-indigo-100">Discover ready</span>
            @endif
            <p class="mt-3 text-sm text-slate-300">{!! $article['linked_summary'] ?? $article['summary'] !!}</p>
        </div>

        <div class="space-y-4 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ __('ui.legal.placeholder_notice') }}</p>
            <p>{{ __('ui.legal.placeholder_copy') }}</p>
            @foreach ($article['sections'] ?? [] as $section)
                <div>
                    <h2 class="text-base font-semibold text-white">{{ $section['title'] }}</h2>
                    <p class="mt-2">{!! $section['linked_body'] ?? $section['body'] !!}</p>
                </div>
            @endforeach
        </div>
    </section>
</x-layouts.public>
