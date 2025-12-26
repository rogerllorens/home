<x-layouts.public title="Terms | Candid Boys">
    @push('head')
        <x-seo-head
            title="Terms | Candid Boys"
            description="Terms of use, 18+ notice, and general guidelines for Candid Boys."
            canonical="{{ url('/terms') }}"
        />
    @endpush

    <section class="space-y-6">
        <h1 class="text-2xl font-semibold text-white">Terms of Service</h1>
        <div class="space-y-5 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">Placeholder notice</p>
            <p>Este contenido es un ejemplo estructural y debe ser reemplazado por un abogado o asesor legal. No constituye asesoría legal.</p>

            <div>
                <h2 class="text-base font-semibold text-white">Eligibility & age</h2>
                <p class="mt-2">El sitio está destinado a mayores de edad. Al continuar confirmas que cumples la edad mínima en tu jurisdicción.</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">Permitted use</h2>
                <p class="mt-2">El contenido se ofrece para visualización personal. No redistribuyas ni alojes el material sin autorización.</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">Moderation</h2>
                <p class="mt-2">Podemos restringir o retirar contenido cuando sea necesario por seguridad o cumplimiento.</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">Contact</h2>
                <p class="mt-2">Para consultas sobre términos, usa la página de contacto.</p>
            </div>
        </div>
    </section>
</x-layouts.public>
