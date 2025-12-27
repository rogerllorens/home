@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = $pageTitle ?? \Illuminate\Support\Str::limit($heading . ' | Candid Boys', $titleMax, '');
    $pageDescription = $pageDescription ?? \Illuminate\Support\Str::limit($description, $descMax, '');
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

    <section class="mb-8">
        <h1 class="text-2xl font-semibold">{{ __('ui.tag.title', ['tag' => $heading]) }}</h1>
        <p class="mt-2 text-sm text-slate-400">{!! $linkedDescription ?? $description !!}</p>
        <p class="mt-2 text-sm text-slate-400">{{ __('ui.tag.helper') }}</p>
        @if (!empty($cluster))
            <div class="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Hub temático asociado:
                <a class="font-semibold text-white hover:text-emerald-200" href="{{ route('public.theme', $cluster->slug) }}">
                    {{ $cluster->name }}
                </a>
            </div>
        @endif
        @if ($videos->isEmpty())
            <p class="mt-4 text-sm text-slate-400">{{ __('ui.tag.empty') }}</p>
            <a class="mt-3 inline-flex rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500" href="{{ route('public.home') }}">
                {{ __('ui.tag.browse_latest') }}
            </a>
        @endif
    </section>

    <h2 class="mb-3 text-lg font-semibold text-white">{{ __('ui.tag.videos', ['tag' => $heading]) }}</h2>
    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <p class="text-sm text-slate-400">No videos for this tag.</p>
        @endforelse
    </x-video-grid>

    <div class="mt-6 rounded-md border border-white/10 bg-white/5 px-4 py-3">
        {{ $videos->links() }}
    </div>
</x-layouts.public>
