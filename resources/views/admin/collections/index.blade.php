<x-layouts.admin title="Admin | Collections" heading="Collections" subheading="Gestiona colecciones curadas">
    <div class="flex items-center justify-between">
        <div class="text-sm text-slate-400">{{ $collections->total() }} colecciones</div>
        <a class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" href="{{ route('admin.collections.create') }}">Nueva colección</a>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Nombre</th>
                    <th class="px-4 py-3">Slug</th>
                    <th class="px-4 py-3">Idioma</th>
                    <th class="px-4 py-3">Auto</th>
                    <th class="px-4 py-3">Visible</th>
                    <th class="px-4 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($collections as $collection)
                    <tr>
                        <td class="px-4 py-3 font-medium">{{ $collection->name }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $collection->slug }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $collection->language ?? 'en' }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $collection->is_auto_managed ? 'Sí' : 'No' }}</td>
                        <td class="px-4 py-3">
                            <span class="rounded-full px-2 py-1 text-xs {{ $collection->is_public ? 'bg-emerald-500/10 text-emerald-200' : 'bg-rose-500/10 text-rose-200' }}">
                                {{ $collection->is_public ? 'Sí' : 'No' }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <a class="text-indigo-300 hover:text-indigo-200" href="{{ route('admin.collections.edit', $collection) }}">Editar</a>
                                <form method="POST" action="{{ route('admin.collections.destroy', $collection) }}" onsubmit="return confirm('¿Eliminar esta colección?');">
                                    @csrf
                                    @method('DELETE')
                                    <button class="text-rose-300 hover:text-rose-200" type="submit">Eliminar</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="4">No hay colecciones.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div>
        {{ $collections->links() }}
    </div>
</x-layouts.admin>
