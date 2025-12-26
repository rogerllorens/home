@php
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = __('ui.meta.live_title', ['brand' => $brand]);
    $affiliateUrl = $cta?->destination_url ?? config('candidboys.monetization.partner_links.cams.url');
    $ctaUrl = $cta
        ? route('public.cta.redirect', [
            'cta' => $cta->public_id,
            'origin' => 'live',
            'placement' => 'live',
            'landing_type' => 'direct',
        ])
        : $affiliateUrl;
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ __('ui.meta.live_description', ['brand' => $brand]) }}"
            canonical="{{ route('public.live') }}"
        />
    @endpush

    <section class="space-y-6">
        <div class="rounded-xl border border-red-600/40 bg-black/80 p-6">
            <h1 class="text-3xl font-semibold text-white">{{ __('ui.live.title') }}</h1>
            <p class="mt-2 text-sm text-slate-300">{{ __('ui.live.intro_one') }}</p>
            <p class="mt-2 text-sm text-slate-300">{{ __('ui.live.intro_two') }}</p>
            @if ($ctaUrl)
                <a
                    class="mt-4 inline-flex rounded-md bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                    href="{{ $ctaUrl }}"
                    target="_blank"
                    rel="sponsored noopener"
                    data-cta-id="{{ $cta?->public_id }}"
                    data-cta-origin="live"
                >
                    {{ __('ui.live.cta') }}
                </a>
            @endif
        </div>

        <div>
            <h2 class="text-lg font-semibold text-white">{{ __('ui.live.featured') }}</h2>
            <div class="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ((array) __('ui.live.card_labels') as $label)
                    <div class="rounded-lg border border-white/10 bg-white/5 p-4">
                        <p class="text-xs uppercase tracking-wide text-slate-400">{{ $label }}</p>
                        <div class="mt-3 h-32 rounded-md bg-gradient-to-br from-slate-800 to-slate-900"></div>
                        <p class="mt-3 text-sm text-slate-300">{{ __('ui.live.card_body') }}</p>
                    </div>
                @endforeach
            </div>
        </div>
    </section>
</x-layouts.public>
