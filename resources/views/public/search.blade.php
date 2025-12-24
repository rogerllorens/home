<x-layouts.public title="Buscar | Candid Boys">
    @push('head')
        <x-seo-head
            title="Buscar | Candid Boys"
            description="Buscar videos y tags en Candid Boys."
            canonical="{{ route('public.search') }}"
            robots="noindex,follow"
        />
    @endpush
    <section class="mb-8">
        <h1 class="text-2xl font-semibold">Buscar</h1>
        <form class="mt-4" method="GET" action="{{ route('public.search') }}">
            <input
                name="q"
                type="search"
                value="{{ $query }}"
                placeholder="Buscar videos o tags"
                class="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-100"
            />
        </form>
        @if ($query)
            <p class="mt-3 text-sm text-slate-400">Resultados para “{{ $query }}”</p>
        @endif
    </section>

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">No hay resultados.</p>
        @endforelse
    </x-video-grid>

    <div class="mt-6">
        {{ $videos->links() }}
    </div>
</x-layouts.public>
