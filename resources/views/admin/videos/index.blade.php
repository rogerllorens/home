<x-layouts.admin title="Admin | Videos" heading="Videos" subheading="Listado con filtros">
    <form class="grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4 lg:grid-cols-5" method="GET" action="{{ route('admin.videos.index') }}">
        <div>
            <label class="text-xs uppercase text-slate-400" for="status">Status</label>
            <select id="status" name="status" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
                <option value="">Todos</option>
                @foreach ($statuses as $status)
                    <option value="{{ $status->value }}" @selected(($filters['status'] ?? '') === $status->value)>
                        {{ strtoupper($status->value) }}
                    </option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="text-xs uppercase text-slate-400" for="source">Source</label>
            <select id="source" name="source" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
                <option value="">Todas</option>
                @foreach ($sources as $source)
                    <option value="{{ $source->id }}" @selected(($filters['source'] ?? '') == $source->id)>
                        {{ $source->name }}
                    </option>
                @endforeach
            </select>
        </div>
        <div>
            <label class="text-xs uppercase text-slate-400" for="category_slug">Category slug</label>
            <input
                id="category_slug"
                name="category_slug"
                type="text"
                value="{{ $filters['category_slug'] ?? '' }}"
                class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            />
        </div>
        <div>
            <label class="text-xs uppercase text-slate-400" for="q">Buscar</label>
            <input
                id="q"
                name="q"
                type="text"
                value="{{ $filters['q'] ?? '' }}"
                placeholder="Título o SEO"
                class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            />
        </div>
        <div class="flex items-end gap-2">
            <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" type="submit">Filtrar</button>
            <a class="text-sm text-slate-400 hover:text-slate-200" href="{{ route('admin.videos.index') }}">Reset</a>
        </div>
    </form>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Título</th>
                    <th class="px-4 py-3">Source</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Categoría</th>
                    <th class="px-4 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($videos as $video)
                    <tr>
                        <td class="px-4 py-3 font-medium">{{ $video->title }}</td>
                        <td class="px-4 py-3">{{ $video->source?->name ?? '-' }}</td>
                        <td class="px-4 py-3">
                            <span class="rounded-full bg-white/10 px-2 py-1 text-xs uppercase">{{ $video->status->value }}</span>
                        </td>
                        <td class="px-4 py-3">{{ $video->category_slug ?? '-' }}</td>
                        <td class="px-4 py-3">
                            <a class="text-indigo-300 hover:text-indigo-200" href="{{ route('admin.videos.show', $video) }}">Detalle</a>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="5">No hay videos disponibles.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div>
        {{ $videos->links() }}
    </div>
</x-layouts.admin>
