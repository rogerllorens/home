<x-layouts.admin title="Admin | Sources" heading="Sources" subheading="Gestiona fuentes de importación">
    <div class="flex items-center justify-between">
        <div class="text-sm text-slate-400">{{ $sources->total() }} fuentes</div>
        <a class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" href="{{ route('admin.sources.create') }}">Nueva fuente</a>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Nombre</th>
                    <th class="px-4 py-3">Tipo</th>
                    <th class="px-4 py-3">Cron</th>
                    <th class="px-4 py-3">Activa</th>
                    <th class="px-4 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($sources as $source)
                    <tr>
                        <td class="px-4 py-3 font-medium">{{ $source->name }}</td>
                        <td class="px-4 py-3">{{ $source->type->value }}</td>
                        <td class="px-4 py-3">{{ $source->import_schedule_cron }}</td>
                        <td class="px-4 py-3">
                            <span class="rounded-full px-2 py-1 text-xs {{ $source->is_active ? 'bg-emerald-500/10 text-emerald-200' : 'bg-rose-500/10 text-rose-200' }}">
                                {{ $source->is_active ? 'Sí' : 'No' }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <a class="text-indigo-300 hover:text-indigo-200" href="{{ route('admin.sources.edit', $source) }}">Editar</a>
                                <form method="POST" action="{{ route('admin.sources.destroy', $source) }}" onsubmit="return confirm('¿Eliminar esta fuente?');">
                                    @csrf
                                    @method('DELETE')
                                    <button class="text-rose-300 hover:text-rose-200" type="submit">Eliminar</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="5">No hay fuentes configuradas.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div>
        {{ $sources->links() }}
    </div>
</x-layouts.admin>
