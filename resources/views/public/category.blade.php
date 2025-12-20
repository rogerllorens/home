<x-layouts.public title="{{ $heading }} | Candid Boys">
    <section class="mb-8">
        <h1 class="text-2xl font-semibold">{{ $heading }}</h1>
        <p class="mt-2 text-sm text-slate-400">{{ $description }}</p>
    </section>

    <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">No hay videos en esta categoría.</p>
        @endforelse
    </div>

    <div class="mt-6">
        {{ $videos->links() }}
    </div>
</x-layouts.public>
