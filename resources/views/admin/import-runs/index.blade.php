<x-layouts.admin title="Admin | Import Runs" heading="Import runs" subheading="Historial de importaciones">
    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Fuente</th>
                    <th class="px-4 py-3">Estado</th>
                    <th class="px-4 py-3">Inicio</th>
                    <th class="px-4 py-3">Fin</th>
                    <th class="px-4 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($runs as $run)
                    <tr>
                        <td class="px-4 py-3 font-medium">{{ $run->source?->name ?? 'Sin fuente' }}</td>
                        <td class="px-4 py-3">{{ $run->status->value }}</td>
                        <td class="px-4 py-3">{{ $run->started_at?->format('d/m/Y H:i') ?? '-' }}</td>
                        <td class="px-4 py-3">{{ $run->finished_at?->format('d/m/Y H:i') ?? '-' }}</td>
                        <td class="px-4 py-3">
                            <a class="text-indigo-300 hover:text-indigo-200" href="{{ route('admin.import-runs.show', $run) }}">Ver log</a>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="5">No hay import runs registrados.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div>
        {{ $runs->links() }}
    </div>
</x-layouts.admin>
