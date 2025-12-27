@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = \Illuminate\Support\Str::limit(__('ui.meta.categories_title', ['brand' => $brand]), $titleMax, '');
    $pageDescription = \Illuminate\Support\Str::limit(__('ui.meta.categories_description', ['brand' => $brand]), $descMax, '');
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ route('public.categories') }}"
        />
    @endpush

    <section class="mb-8">
        <h1 class="text-2xl font-semibold text-white">{{ __('ui.nav.categories') }}</h1>
        <p class="mt-2 text-sm text-slate-400">{{ __('ui.categories.intro') }}</p>
    </section>

    <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        @forelse ($categories as $category)
            <a
                class="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-red-400/70 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                href="{{ route('public.category', $category['slug']) }}"
            >
                <span>{{ $category['label'] }}</span>
                <span class="text-xs text-slate-400">{{ __('ui.links.view') }}</span>
            </a>
        @empty
            <p class="text-sm text-slate-400">{{ __('ui.empty.no_categories') }}</p>
        @endforelse
    </div>
</x-layouts.public>
