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
    @endpush

    <section class="space-y-6">
        <div class="rounded-xl border border-white/10 bg-white/5 p-6">
            <h1 class="text-3xl font-semibold text-white">{{ $article['title'] }}</h1>
            <p class="mt-3 text-sm text-slate-300">{{ $article['summary'] }}</p>
        </div>

        <div class="space-y-4 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">Placeholder notice</p>
            <p>Este texto es un ejemplo y debe ser revisado por un abogado o asesor legal. No constituye asesoría legal.</p>
            @foreach ($article['sections'] ?? [] as $section)
                <div>
                    <h2 class="text-base font-semibold text-white">{{ $section['title'] }}</h2>
                    <p class="mt-2">{{ $section['body'] }}</p>
                </div>
            @endforeach
        </div>
    </section>
</x-layouts.public>
