<x-layouts.public title="Privacy | Candid Boys">
    @push('head')
        <x-seo-head
            title="Privacy | Candid Boys"
            description="Privacy overview and data handling for Candid Boys."
            canonical="{{ url('/privacy') }}"
        />
    @endpush

    <section class="space-y-6">
        <h1 class="text-2xl font-semibold text-white">Privacy Policy</h1>
        <div class="space-y-5 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">Placeholder notice</p>
            <p>Este contenido es un ejemplo estructural y debe ser reemplazado por un abogado o asesor legal. No constituye asesoría legal.</p>

            <div>
                <h2 class="text-base font-semibold text-white">Data we collect</h2>
                <p class="mt-2">Recogemos datos mínimos para mejorar rendimiento y calidad del contenido, como métricas agregadas.</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">Analytics & cookies</h2>
                <p class="mt-2">La analítica puede usar cookies o identificadores equivalentes para entender el uso del sitio.</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">Your requests</h2>
                <p class="mt-2">Si deseas ejercer derechos o realizar consultas, contáctanos a través de los canales publicados.</p>
            </div>
        </div>
    </section>
</x-layouts.public>
