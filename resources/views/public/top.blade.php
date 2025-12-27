@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit("{$heading} | Candid Boys", $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit($description, $descMax, '');
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
        <h1 class="text-2xl font-semibold text-white">{{ $heading }}</h1>
        <p class="mt-2 text-sm text-slate-300">{{ $description }}</p>
    </section>

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">No videos available right now.</p>
        @endforelse
    </x-video-grid>
</x-layouts.public>
