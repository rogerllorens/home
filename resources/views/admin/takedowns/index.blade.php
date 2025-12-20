<x-layouts.admin title="Admin | Takedowns" heading="Takedowns" subheading="Solicitudes y acciones">
    <div class="flex items-center justify-between">
        <div class="text-sm text-slate-400">{{ $takedowns->total() }} registros</div>
        <a class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" href="{{ route('admin.takedowns.create') }}">Nuevo takedown</a>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Video</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Solicitado</th>
                    <th class="px-4 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($takedowns as $takedown)
                    <tr>
                        <td class="px-4 py-3 font-medium">{{ $takedown->video?->title ?? '-' }}</td>
                        <td class="px-4 py-3">{{ $takedown->status->value }}</td>
                        <td class="px-4 py-3">{{ $takedown->requested_at?->format('d/m/Y') ?? '-' }}</td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <a class="text-indigo-300 hover:text-indigo-200" href="{{ route('admin.takedowns.edit', $takedown) }}">Editar</a>
                                <form method="POST" action="{{ route('admin.takedowns.destroy', $takedown) }}" onsubmit="return confirm('¿Eliminar takedown?');">
                                    @csrf
                                    @method('DELETE')
                                    <button class="text-rose-300 hover:text-rose-200" type="submit">Eliminar</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="4">No hay takedowns.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div>
        {{ $takedowns->links() }}
    </div>
</x-layouts.admin>
