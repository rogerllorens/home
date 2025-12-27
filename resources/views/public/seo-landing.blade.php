@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit($pageTitle ?? $landing->title_template, $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit($pageDescription ?? $landing->description_template, $descMax, '');
    $categoryLabel = $tokens['{category}'] ?? '';
    $tagLabel = $tokens['{tag}'] ?? '';
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ request()->fullUrl() }}"
        />
        <x-schema.item-list :videos="$videos" />
        @if (!empty($faq))
            <x-schema.faq :items="$faq" />
        @endif
    @endpush

    <section class="mb-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-slate-950 to-slate-950 p-6 md:p-8">
        <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.3em] text-indigo-300">Discover</p>
            <h1 class="text-3xl font-semibold text-white md:text-4xl">{{ $pageTitle }}</h1>
            <p class="max-w-3xl text-sm text-slate-300 md:text-base">{!! $linkedDescription ?? $pageDescription !!}</p>
            <div class="flex flex-wrap gap-2 text-xs text-slate-300">
                <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1">{{ $categoryLabel }}</span>
                <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1">{{ $tagLabel }}</span>
            </div>
        </div>
    </section>

    <section class="mb-10">
        <h2 class="mb-4 text-lg font-semibold text-white">Videos destacados</h2>
        <x-video-grid>
            @forelse ($videos as $video)
                <x-video-card :video="$video" />
            @empty
                <p class="text-sm text-slate-400">No hay videos disponibles aún para esta combinación.</p>
            @endforelse
        </x-video-grid>
        <div class="mt-6 rounded-md border border-white/10 bg-white/5 px-4 py-3">
            {{ $videos->links() }}
        </div>
    </section>

    @if (!empty($faq))
        <section class="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 class="text-lg font-semibold text-white">Preguntas frecuentes</h2>
            <div class="mt-4 space-y-4">
                @foreach ($faq as $item)
                    <div class="rounded-xl border border-white/5 bg-slate-950/60 p-4">
                        <h3 class="text-sm font-semibold text-white">{{ $item['question'] }}</h3>
                        <p class="mt-2 text-sm text-slate-300">{{ $item['answer'] }}</p>
                    </div>
                @endforeach
            </div>
        </section>
    @endif
</x-layouts.public>
