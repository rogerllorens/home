@php
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = __('ui.meta.about_title', ['brand' => $brand]);
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ __('ui.meta.about_description', ['brand' => $brand]) }}"
            canonical="{{ route('public.about') }}"
        />
    @endpush

    <section class="space-y-6">
        <div class="rounded-xl border border-white/10 bg-white/5 p-6">
            <h1 class="text-3xl font-semibold text-white">{{ __('ui.about.title') }}</h1>
            <p class="mt-3 text-sm text-slate-300">{{ __('ui.about.intro') }}</p>
        </div>

        <div class="space-y-4 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ __('ui.legal.placeholder_notice') }}</p>
            <p>{{ __('ui.legal.placeholder_copy') }}</p>

            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.about.legal') }}</h2>
                <p class="mt-2">{{ __('ui.about.legal_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.about.takedowns') }}</h2>
                <p class="mt-2">{{ __('ui.about.takedowns_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.about.affiliate') }}</h2>
                <p class="mt-2">{{ config('candidboys.ui.affiliate_notice_text') }}</p>
            </div>
        </div>
    </section>
</x-layouts.public>
