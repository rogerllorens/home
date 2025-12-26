@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit('Tags | Candid Boys', $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit('Browse popular tags on Candid Boys.', $descMax, '');
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ route('public.tags') }}"
        />
    @endpush

    <section class="mb-8">
        <h1 class="text-2xl font-semibold text-white">Popular tags</h1>
        <p class="mt-2 text-sm text-slate-400">Etiquetas que más se están viendo esta semana.</p>
    </section>

    <div class="flex flex-wrap gap-2">
        @forelse ($tags as $tag)
            <a
                class="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-red-400/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                href="{{ route('public.tag', $tag->tag) }}"
            >
                #{{ $tag->tag }}
            </a>
        @empty
            <p class="text-sm text-slate-400">No tags available.</p>
        @endforelse
    </div>
</x-layouts.public>
