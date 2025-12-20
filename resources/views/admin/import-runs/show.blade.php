<x-layouts.admin
    title="Admin | Import Run"
    heading="Import run"
    subheading="Detalle de ejecución"
>
    <div class="grid gap-4 lg:grid-cols-2">
        <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <p class="text-slate-400">Fuente</p>
            <p class="mt-1 font-semibold">{{ $run->source?->name ?? 'Sin fuente' }}</p>
            <p class="mt-3 text-slate-400">Estado</p>
            <p class="mt-1 font-semibold">{{ $run->status->value }}</p>
            <p class="mt-3 text-slate-400">Inicio</p>
            <p class="mt-1">{{ $run->started_at?->format('d/m/Y H:i') ?? '-' }}</p>
            <p class="mt-3 text-slate-400">Fin</p>
            <p class="mt-1">{{ $run->finished_at?->format('d/m/Y H:i') ?? '-' }}</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <p class="text-slate-400">Meta</p>
            <pre class="mt-2 whitespace-pre-wrap text-xs text-slate-200">{{ json_encode($run->meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</pre>
        </div>
    </div>

    <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
        <p class="text-slate-400">Error log</p>
        <pre class="mt-2 whitespace-pre-wrap text-xs text-rose-200">{{ $run->error_message ?? 'Sin errores' }}</pre>
    </div>
</x-layouts.admin>
