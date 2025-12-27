<x-layouts.admin title="Admin | SEO Health" heading="SEO Health" subheading="Checklist técnico de SEO">
    <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <form class="flex flex-wrap items-center gap-3 text-sm" method="GET" action="{{ route('admin.seo-health.index') }}">
            <input name="type" value="{{ $type }}" class="rounded-md border border-white/10 bg-slate-950 px-3 py-2" placeholder="Tipo" />
            <select name="severity" class="rounded-md border border-white/10 bg-slate-950 px-3 py-2">
                <option value="" @selected($severity === '')>Severidad</option>
                <option value="high" @selected($severity === 'high')>Alta</option>
                <option value="medium" @selected($severity === 'medium')>Media</option>
                <option value="low" @selected($severity === 'low')>Baja</option>
            </select>
            <select name="status" class="rounded-md border border-white/10 bg-slate-950 px-3 py-2">
                <option value="" @selected($status === '')>Estado</option>
                <option value="new" @selected($status === 'new')>Nuevo</option>
                <option value="resolved" @selected($status === 'resolved')>Resuelto</option>
            </select>
            <button class="rounded-md border border-white/10 px-3 py-2 text-slate-200 hover:border-indigo-400/60" type="submit">Filtrar</button>
        </form>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="w-full text-left text-sm">
            <thead class="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                    <th class="px-4 py-3">URL</th>
                    <th class="px-4 py-3">Tipo</th>
                    <th class="px-4 py-3">Severidad</th>
                    <th class="px-4 py-3">Estado</th>
                    <th class="px-4 py-3">Acción</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($issues as $issue)
                    <tr>
                        <td class="px-4 py-3 text-slate-200">{{ $issue->url }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $issue->issue_type }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $issue->severity }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $issue->status }}</td>
                        <td class="px-4 py-3">
                            @if ($issue->status !== 'resolved')
                                <form method="POST" action="{{ route('admin.seo-health.resolve', $issue) }}">
                                    @csrf
                                    <button class="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400/60" type="submit">Resolver</button>
                                </form>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="5">No hay issues.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</x-layouts.admin>
