<x-layouts.admin title="Admin | Category candidates" heading="Category candidates" subheading="Candidatos detectados desde búsquedas y tags">
    <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-slate-400">{{ $candidates->total() }} candidatos</div>
        <form method="GET" class="flex items-center gap-2 text-sm">
            <label class="text-slate-400" for="status-filter">Estado</label>
            <select id="status-filter" name="status" class="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm">
                <option value="">Todos</option>
                @foreach (['candidate', 'approved', 'auto_approved', 'rejected'] as $option)
                    <option value="{{ $option }}" @selected($status === $option)>{{ ucfirst(str_replace('_', ' ', $option)) }}</option>
                @endforeach
            </select>
            <button class="rounded-lg border border-white/10 px-3 py-2 text-sm" type="submit">Filtrar</button>
        </form>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Nombre</th>
                    <th class="px-4 py-3">Slug</th>
                    <th class="px-4 py-3">Fuente</th>
                    <th class="px-4 py-3">Vídeos</th>
                    <th class="px-4 py-3">Hits 30d</th>
                    <th class="px-4 py-3">Estado</th>
                    <th class="px-4 py-3">Subcategoría</th>
                    <th class="px-4 py-3">Padre</th>
                    <th class="px-4 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($candidates as $candidate)
                    <tr>
                        <td class="px-4 py-3 font-medium">{{ $candidate->name }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $candidate->slug }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $candidate->source }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $candidate->videos_count }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $candidate->hits_last_30d }}</td>
                        <td class="px-4 py-3">
                            <span class="rounded-full px-2 py-1 text-xs {{ $candidate->status === 'approved' ? 'bg-emerald-500/10 text-emerald-200' : ($candidate->status === 'rejected' ? 'bg-rose-500/10 text-rose-200' : 'bg-slate-500/10 text-slate-200') }}">
                                {{ ucfirst(str_replace('_', ' ', $candidate->status)) }}
                            </span>
                        </td>
                        <td class="px-4 py-3 text-slate-300">{{ $candidate->is_subcategory ? 'Sí' : 'No' }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $candidate->parent?->name ?? '—' }}</td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <form method="POST" action="{{ route('admin.category-candidates.approve', $candidate) }}">
                                    @csrf
                                    <button class="text-emerald-300 hover:text-emerald-200" type="submit">Aprobar</button>
                                </form>
                                <form method="POST" action="{{ route('admin.category-candidates.reject', $candidate) }}">
                                    @csrf
                                    <button class="text-rose-300 hover:text-rose-200" type="submit">Rechazar</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="9">No hay candidatos.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div>
        {{ $candidates->links() }}
    </div>
</x-layouts.admin>
