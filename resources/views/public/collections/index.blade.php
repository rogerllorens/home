@php
    $pageTitle = 'Collections | Candid Boys';
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="Colecciones curadas para descubrir vídeos por temática."
            canonical="{{ route('public.collections.index') }}"
        />
    @endpush

    <section class="mb-6">
        <h1 class="text-2xl font-semibold text-white">{{ __('ui.collections.title') }}</h1>
        <p class="mt-2 text-sm text-slate-300">{{ __('ui.collections.intro') }}</p>
    </section>

    <div class="grid gap-4 md:grid-cols-2">
        @forelse ($collections as $collection)
            <a class="rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-red-500/60 hover:bg-white/10" href="{{ route('public.collections.show', $collection->slug) }}">
                <div class="flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-white">{{ $collection->name }}</h2>
                    <span class="text-xs text-slate-400">{{ $collection->videos_count }} videos</span>
                </div>
                <p class="mt-2 text-sm text-slate-300">{{ \Illuminate\Support\Str::limit($collection->description, 140) }}</p>
            </a>
        @empty
            <p class="text-sm text-slate-400">No collections available right now.</p>
        @endforelse
    </div>
</x-layouts.public>
