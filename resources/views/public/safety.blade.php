@php
    $pageTitle = 'Safety tips | Candid Boys';
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="General safety and privacy tips for browsing adult content."
            canonical="{{ url('/safety') }}"
        />
    @endpush

    <section class="space-y-6">
        <div class="rounded-xl border border-white/10 bg-white/5 p-6">
            <h1 class="text-3xl font-semibold text-white">Safety & privacy tips</h1>
            <p class="mt-3 text-sm text-slate-300">Consejos generales para navegar contenido adulto de forma más segura.</p>
        </div>

        <div class="space-y-4 text-sm text-slate-300">
            <div>
                <h2 class="text-base font-semibold text-white">Use personal devices</h2>
                <p class="mt-2">Siempre que sea posible, usa dispositivos personales para mayor privacidad.</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">Close shared sessions</h2>
                <p class="mt-2">Si usas un dispositivo compartido, cierra sesión y borra el historial cuando termines.</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">Review privacy settings</h2>
                <p class="mt-2">Revisa ajustes de privacidad en tu navegador y servicios asociados.</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">Stay mindful</h2>
                <p class="mt-2">Explora con calma y toma descansos si lo necesitas.</p>
            </div>
        </div>
    </section>
</x-layouts.public>
