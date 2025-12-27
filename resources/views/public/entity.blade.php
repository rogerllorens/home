@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit("{$entity->name} | Candid Boys", $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit($entity->description ?? "Videos relacionados con {$entity->name}.", $descMax, '');
    $schemaType = in_array($entity->type, ['category', 'concept', 'theme'], true) ? 'DefinedTerm' : 'Thing';
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ route('public.entity', $entity->slug) }}"
        />
        <x-schema.entity :entity="$entity" />
        <x-schema.item-list :videos="$videos" />
    @endpush

    <section class="mb-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-slate-950 to-slate-950 p-6 md:p-8">
        <p class="text-xs uppercase tracking-[0.3em] text-indigo-300">Entidad</p>
        <h1 class="mt-3 text-3xl font-semibold text-white md:text-4xl">{{ $entity->name }}</h1>
        <p class="mt-3 max-w-3xl text-sm text-slate-300 md:text-base">{{ $entity->description ?? 'Explora contenido relacionado con esta entidad.' }}</p>
        <span class="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
            {{ $entity->type }}
        </span>
    </section>

    <section class="mb-10">
        <h2 class="mb-4 text-lg font-semibold text-white">Videos relacionados</h2>
        <x-video-grid>
            @forelse ($videos as $video)
                <x-video-card :video="$video" />
            @empty
                <p class="text-sm text-slate-400">No hay videos asociados todavía.</p>
            @endforelse
        </x-video-grid>
    </section>

    <section class="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 class="text-lg font-semibold text-white">Entidades relacionadas</h2>
        <div class="mt-4 flex flex-wrap gap-2">
            @forelse ($relatedEntities as $related)
                <a class="rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-indigo-400/60" href="{{ route('public.entity', $related->slug) }}">
                    {{ $related->name }}
                </a>
            @empty
                <p class="text-sm text-slate-400">Añade relaciones para enriquecer el grafo.</p>
            @endforelse
        </div>
    </section>
</x-layouts.public>
