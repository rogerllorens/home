<x-layouts.admin title="Admin | Landing candidates" heading="Landing candidates" subheading="Detecta búsquedas repetidas para crear landings SEO">
    <div class="flex items-center justify-between">
        <div class="text-sm text-slate-400">{{ $candidates->total() }} candidatos</div>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Query</th>
                    <th class="px-4 py-3">Slug</th>
                    <th class="px-4 py-3">Hits 30d</th>
                    <th class="px-4 py-3">Resultados</th>
                    <th class="px-4 py-3">Estado</th>
                    <th class="px-4 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($candidates as $candidate)
                    <tr>
                        <td class="px-4 py-3 font-medium">{{ $candidate->query }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $candidate->slug }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $candidate->hits_last_30d }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $candidate->videos_count }}</td>
                        <td class="px-4 py-3">
                            <span class="rounded-full px-2 py-1 text-xs {{ $candidate->status === 'approved' ? 'bg-emerald-500/10 text-emerald-200' : ($candidate->status === 'ignored' ? 'bg-rose-500/10 text-rose-200' : 'bg-slate-500/10 text-slate-200') }}">
                                {{ ucfirst($candidate->status) }}
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <div class="flex items-center gap-2">
                                <form method="POST" action="{{ route('admin.landing-candidates.approve', $candidate) }}">
                                    @csrf
                                    <button class="text-emerald-300 hover:text-emerald-200" type="submit">Aprobar</button>
                                </form>
                                <form method="POST" action="{{ route('admin.landing-candidates.ignore', $candidate) }}">
                                    @csrf
                                    <button class="text-rose-300 hover:text-rose-200" type="submit">Ignorar</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="6">No hay candidatos.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div>
        {{ $candidates->links() }}
    </div>
</x-layouts.admin>
