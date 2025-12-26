@php
    $brand = config('app.name', __('ui.brand'));
    $ctaTitle = $copy['title'] ?? __('ui.cta.fallback_title');
    $pageTitle = __('ui.meta.title_with_brand', ['title' => $ctaTitle, 'brand' => $brand]);
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ __('ui.meta.cta_landing_description', ['brand' => $brand]) }}"
            canonical="{{ url()->current() }}"
            robots="noindex,follow"
        />
    @endpush

    <section class="space-y-6">
        <div class="rounded-xl border border-red-600/40 bg-black/80 p-6">
            <p class="text-xs uppercase tracking-wide text-red-300">{{ __('ui.cta.recommended') }}</p>
            <h1 class="mt-2 text-3xl font-semibold text-white">{{ $copy['title'] ?? __('ui.cta.continue') }}</h1>
            <ul class="mt-4 space-y-2 text-sm text-slate-300">
                @foreach ($copy['bullets'] ?? [] as $bullet)
                    <li class="flex items-start gap-2">
                        <span class="mt-1 inline-flex h-2 w-2 rounded-full bg-red-400"></span>
                        <span>{{ $bullet }}</span>
                    </li>
                @endforeach
            </ul>
            <a
                class="mt-5 inline-flex rounded-md bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                href="{{ $trackUrl ?: $affiliateUrl }}"
                target="_blank"
                rel="sponsored noopener"
                data-cta-id="{{ $ctaId ?? '' }}"
                data-cta-origin="prelander"
            >
                {{ __('ui.cta.continue') }}
            </a>
            <p class="mt-3 text-xs text-slate-500">{{ __('ui.cta.partner_notice') }}</p>
        </div>
    </section>
</x-layouts.public>
