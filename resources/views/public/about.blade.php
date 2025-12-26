@php
    $pageTitle = 'About | Candid Boys';
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="Learn about the Candid Boys approach to curated embedded videos."
            canonical="{{ url('/about') }}"
        />
    @endpush

    <section class="space-y-6">
        <div class="rounded-xl border border-white/10 bg-white/5 p-6">
            <h1 class="text-3xl font-semibold text-white">About Candid Boys</h1>
            <p class="mt-3 text-sm text-slate-300">
                Candid Boys es un sitio curado de vídeos embebidos, organizado para que puedas descubrir contenido de forma rápida y ordenada.
            </p>
        </div>

        <div class="space-y-4 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">Placeholder notice</p>
            <p>Este texto es un ejemplo y debe ser revisado por un abogado o asesor legal. No constituye asesoría legal.</p>

            <div>
                <h2 class="text-base font-semibold text-white">Legal & adult content</h2>
                <p class="mt-2">Nuestro objetivo es mostrar únicamente contenido legal y dirigido a adultos. Filtramos y revisamos de forma continua.</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">Takedowns</h2>
                <p class="mt-2">Respetamos las solicitudes de retirada y atendemos reportes de contenido con prioridad.</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">Affiliate links</h2>
                <p class="mt-2">{{ config('candidboys.ui.affiliate_notice_text') }}</p>
            </div>
        </div>
    </section>
</x-layouts.public>
