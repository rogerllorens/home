<x-layouts.public title="{{ $heading }} | Candid Boys">
    @push('head')
        <meta name="description" content="{{ $description }}">
        <link rel="canonical" href="{{ route('public.category', $categorySlug) }}">
    @endpush

    <section class="mb-6">
        <h1 class="text-2xl font-semibold text-white">{{ $heading }}</h1>
        <p class="mt-2 text-sm text-slate-300">{{ $description }}</p>
    </section>

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" :show-category="false" />
        @empty
            <p class="text-sm text-slate-400">No hay videos en esta categoría.</p>
        @endforelse
    </x-video-grid>

    <div class="mt-6">
        {{ $videos->links() }}
    </div>
</x-layouts.public>
