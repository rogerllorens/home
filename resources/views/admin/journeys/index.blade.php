<x-layouts.admin title="Admin | Journeys" heading="Journeys" subheading="Rutas temáticas">
    <div class="flex items-center justify-between">
        <p class="text-sm text-slate-400">Gestiona journeys temáticos para el home y la ficha de vídeo.</p>
        <a class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" href="{{ route('admin.journeys.create') }}">Nuevo journey</a>
    </div>

    <div class="mt-6 overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40 text-left text-slate-400">
                <tr>
                    <th class="px-4 py-3">Título</th>
                    <th class="px-4 py-3">Slug</th>
                    <th class="px-4 py-3">Estado</th>
                    <th class="px-4 py-3">Actualizado</th>
                    <th class="px-4 py-3"></th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($journeys as $journey)
                    <tr>
                        <td class="px-4 py-3 font-semibold text-slate-100">{{ $journey->title }}</td>
                        <td class="px-4 py-3 text-slate-400">{{ $journey->slug }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $journey->status?->value ?? $journey->status }}</td>
                        <td class="px-4 py-3 text-slate-400">{{ $journey->updated_at?->format('Y-m-d') }}</td>
                        <td class="px-4 py-3 text-right">
                            <a class="text-sm text-indigo-300 hover:text-indigo-200" href="{{ route('admin.journeys.edit', $journey) }}">Editar</a>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="5">No hay journeys disponibles.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">
        {{ $journeys->links() }}
    </div>
</x-layouts.admin>
