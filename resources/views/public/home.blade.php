<x-layouts.public title="Candid Boys | Home">
    <section class="mb-10">
        <h1 class="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Descubre lo más destacado
        </h1>
        <p class="mt-3 max-w-2xl text-sm text-slate-300">
            Navega por tendencias, categorías top y los últimos publicados en un diseño limpio y rápido.
        </p>
    </section>

    <section class="mb-12">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Trending</h2>
        </div>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @forelse ($trending as $video)
                <x-video-card :video="$video" />
            @empty
                <p class="text-sm text-slate-400">No hay videos trending aún.</p>
            @endforelse
        </div>
    </section>

    <section class="mb-12">
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Categorías top</h2>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            @forelse ($categories as $category)
                <a class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm hover:border-indigo-400/40" href="{{ route('public.category', $category->category_slug) }}">
                    <p class="text-base font-semibold">{{ \Illuminate\Support\Str::headline($category->category_slug) }}</p>
                    <p class="mt-2 text-xs text-slate-400">{{ $category->total }} videos</p>
                </a>
            @empty
                <p class="text-sm text-slate-400">Sin categorías disponibles.</p>
            @endforelse
        </div>
    </section>

    <section>
        <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold">Últimos publicados</h2>
        </div>
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            @forelse ($latest as $video)
                <x-video-card :video="$video" />
            @empty
                <p class="text-sm text-slate-400">No hay videos recientes.</p>
            @endforelse
        </div>
    </section>
</x-layouts.public>
