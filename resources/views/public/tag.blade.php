<x-layouts.public title="{{ $heading }} | Candid Boys">
    <section class="mb-8">
        <h1 class="text-2xl font-semibold">Tag: {{ $heading }}</h1>
        <p class="mt-2 text-sm text-slate-400">{{ $description }}</p>
    </section>

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">No hay videos para este tag.</p>
        @endforelse
    </x-video-grid>

    <div class="mt-6">
        {{ $videos->links() }}
    </div>
</x-layouts.public>
