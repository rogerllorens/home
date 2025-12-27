@php
    $pageTitle = ($collection->name ?? 'Collection') . ' | Candid Boys';
    $pageDescription = $collection->description ?: "Curated collection of videos about {$collection->name}.";
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ request()->fullUrl() }}"
        />
        <x-schema.item-list :videos="$videos" />
    @endpush

    <section class="mb-6">
        <h1 class="text-2xl font-semibold text-white">{{ $collection->name }}</h1>
        <p class="mt-2 text-sm text-slate-300">{{ $pageDescription }}</p>
    </section>

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">No videos in this collection.</p>
        @endforelse
    </x-video-grid>
</x-layouts.public>
