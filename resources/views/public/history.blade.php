@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit(__('ui.history.title', [], app()->getLocale()), $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit(__('ui.history.description', [], app()->getLocale()), $descMax, '');
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ request()->fullUrl() }}"
        />
    @endpush

    <section class="mb-6">
        <h1 class="text-2xl font-semibold text-white">{{ __('ui.history.title') }}</h1>
        <p class="mt-2 text-sm text-slate-300">{{ __('ui.history.description') }}</p>
    </section>

    <x-video-grid>
        @forelse ($videos as $video)
            <x-video-card :video="$video" />
        @empty
            <div class="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                {{ __('ui.history.empty') }}
            </div>
        @endforelse
    </x-video-grid>
</x-layouts.public>
