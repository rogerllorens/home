@php
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = __('ui.meta.safety_title', ['brand' => $brand]);
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ __('ui.meta.safety_description', ['brand' => $brand]) }}"
            canonical="{{ route('public.safety') }}"
        />
    @endpush

    <section class="space-y-6">
        <div class="rounded-xl border border-white/10 bg-white/5 p-6">
            <h1 class="text-3xl font-semibold text-white">{{ __('ui.safety.title') }}</h1>
            <p class="mt-3 text-sm text-slate-300">{{ __('ui.safety.intro') }}</p>
        </div>

        <div class="space-y-4 text-sm text-slate-300">
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.safety.personal') }}</h2>
                <p class="mt-2">{{ __('ui.safety.personal_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.safety.sessions') }}</h2>
                <p class="mt-2">{{ __('ui.safety.sessions_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.safety.privacy') }}</h2>
                <p class="mt-2">{{ __('ui.safety.privacy_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.safety.mindful') }}</h2>
                <p class="mt-2">{{ __('ui.safety.mindful_body') }}</p>
            </div>
        </div>
    </section>
</x-layouts.public>
