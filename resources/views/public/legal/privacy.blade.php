@php
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = __('ui.meta.privacy_title', ['brand' => $brand]);
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ __('ui.meta.privacy_description', ['brand' => $brand]) }}"
            canonical="{{ route('public.privacy') }}"
        />
    @endpush

    <section class="space-y-6">
        <h1 class="text-2xl font-semibold text-white">{{ __('ui.legal.privacy.title') }}</h1>
        <div class="space-y-5 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ __('ui.legal.placeholder_notice') }}</p>
            <p>{{ __('ui.legal.placeholder_copy') }}</p>

            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.privacy.data') }}</h2>
                <p class="mt-2">{{ __('ui.legal.privacy.data_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.privacy.analytics') }}</h2>
                <p class="mt-2">{{ __('ui.legal.privacy.analytics_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.privacy.requests') }}</h2>
                <p class="mt-2">{{ __('ui.legal.privacy.requests_body') }}</p>
            </div>
        </div>
    </section>
</x-layouts.public>
