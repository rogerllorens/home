@php
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = __('ui.meta.terms_title', ['brand' => $brand]);
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ __('ui.meta.terms_description', ['brand' => $brand]) }}"
            canonical="{{ route('public.terms') }}"
        />
    @endpush

    <section class="space-y-6">
        <h1 class="text-2xl font-semibold text-white">{{ __('ui.legal.terms.title') }}</h1>
        <div class="space-y-5 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ __('ui.legal.placeholder_notice') }}</p>
            <p>{{ __('ui.legal.placeholder_copy') }}</p>

            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.terms.eligibility') }}</h2>
                <p class="mt-2">{{ __('ui.legal.terms.eligibility_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.terms.permitted') }}</h2>
                <p class="mt-2">{{ __('ui.legal.terms.permitted_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.terms.moderation') }}</h2>
                <p class="mt-2">{{ __('ui.legal.terms.moderation_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.terms.contact') }}</h2>
                <p class="mt-2">{{ __('ui.legal.terms.contact_body') }}</p>
            </div>
        </div>
    </section>
</x-layouts.public>
