@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit($pageTitle ?? $cluster->name, $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit($pageDescription ?? ($cluster->intro ?? ''), $descMax, '');
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ route('public.theme', $cluster->slug) }}"
        />
        <x-schema.item-list :videos="$videos" />
        <x-schema.web-page name="{{ $pageTitle }}" description="{{ $pageDescription }}" url="{{ route('public.theme', $cluster->slug) }}" />
    @endpush

    <section class="mb-8 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-slate-950 to-slate-950 p-6 md:p-8">
        <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.3em] text-emerald-300">Theme Hub</p>
            <h1 class="text-3xl font-semibold text-white md:text-4xl">{{ $cluster->h1 ?? $cluster->name }}</h1>
            <h2 class="text-lg font-semibold text-emerald-200">{{ $cluster->h2 ?? 'Explora el hub temático' }}</h2>
            <p class="max-w-3xl text-sm text-slate-300 md:text-base">{!! $linkedIntro ?? $cluster->intro ?? '' !!}</p>
            @if ($cluster->is_discover_candidate)
                <span class="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-wide text-emerald-100">Discover ready</span>
            @endif
            @if (!empty($cluster->hero_image_url))
                <img class="w-full rounded-xl border border-white/10 object-cover" src="{{ $cluster->hero_image_url }}" alt="{{ $cluster->name }}">
            @endif
        </div>
    </section>

    <section class="mb-10">
        <h3 class="mb-4 text-lg font-semibold text-white">Videos destacados del tema</h3>
        <x-video-grid>
            @forelse ($videos as $video)
                <x-video-card :video="$video" />
            @empty
                <p class="text-sm text-slate-400">No hay videos disponibles aún para este tema.</p>
            @endforelse
        </x-video-grid>
    </section>

    <section class="grid gap-6 md:grid-cols-2">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 class="text-lg font-semibold text-white">Categorías del cluster</h3>
            <div class="mt-4 flex flex-wrap gap-2">
                @forelse ($categories as $slug)
                    <a class="rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400/60" href="{{ route('public.category', $slug) }}">
                        {{ \Illuminate\Support\Str::headline($slug) }}
                    </a>
                @empty
                    <p class="text-sm text-slate-400">Añade categorías al cluster para fortalecer la temática.</p>
                @endforelse
            </div>
        </div>
        <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 class="text-lg font-semibold text-white">Tags relevantes</h3>
            <div class="mt-4 flex flex-wrap gap-2">
                @forelse ($tags as $tag)
                    <a class="rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400/60" href="{{ route('public.tag', $tag) }}">
                        #{{ $tag }}
                    </a>
                @empty
                    <p class="text-sm text-slate-400">Añade tags al cluster para aumentar la relevancia.</p>
                @endforelse
            </div>
        </div>
    </section>

    <section class="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h3 class="text-lg font-semibold text-white">Landings programáticas relacionadas</h3>
        <div class="mt-4 flex flex-wrap gap-2">
            @forelse ($seoLandings as $item)
                <a class="rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-emerald-400/60" href="{{ $item['url'] }}">
                    {{ $item['landing']->slug }}
                </a>
            @empty
                <p class="text-sm text-slate-400">Añade landings programáticas para reforzar el cluster.</p>
            @endforelse
        </div>
    </section>
</x-layouts.public>
