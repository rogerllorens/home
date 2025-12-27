@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = \Illuminate\Support\Str::limit($journey->title, $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit($journey->description ?? '', $descMax, '');
    $firstVideo = $videos->first();
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ route('public.journeys.show', $journey->slug) }}"
        />
    @endpush

    <section class="space-y-6">
        <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ __('ui.journeys.label') }}</p>
            <h1 class="mt-2 text-2xl font-semibold text-white sm:text-3xl">{{ $journey->title }}</h1>
            <p class="mt-2 text-sm text-slate-300">{{ $journey->description }}</p>
            @if ($firstVideo)
                <a class="mt-4 inline-flex items-center rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($firstVideo->seo_title ?: $firstVideo->title), 'id' => $firstVideo->id, 'journey' => $journey->slug]) }}">
                    {{ __('ui.journeys.start') }}
                </a>
            @endif
        </div>

        <div>
            <h2 class="text-lg font-semibold text-white">{{ __('ui.journeys.videos_title') }}</h2>
            <p class="mt-1 text-sm text-slate-400">{{ __('ui.journeys.videos_subtitle') }}</p>
            <div class="mt-4 space-y-4">
                @foreach ($videos as $index => $video)
                    <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div class="flex items-center gap-4">
                            <div class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-slate-200">
                                {{ $index + 1 }}
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-semibold text-white">{{ $video->seo_title ?: $video->title }}</p>
                                <p class="text-xs text-slate-400">{{ $video->category_slug }}</p>
                            </div>
                            <a class="rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-slate-100 hover:border-white/30" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id, 'journey' => $journey->slug]) }}">
                                {{ __('ui.journeys.play') }}
                            </a>
                        </div>
                    </div>
                @endforeach
            </div>
        </div>
    </section>
</x-layouts.public>
