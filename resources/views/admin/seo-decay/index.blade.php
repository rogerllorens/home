<x-layouts.admin title="Admin | SEO Decay" heading="SEO Decay" subheading="Páginas con caída de relevancia">
    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="w-full text-left text-sm">
            <thead class="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                    <th class="px-4 py-3">URL</th>
                    <th class="px-4 py-3">Tipo</th>
                    <th class="px-4 py-3">Vistas recientes</th>
                    <th class="px-4 py-3">Vistas previas</th>
                    <th class="px-4 py-3">Última actualización</th>
                    <th class="px-4 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($metrics as $metric)
                    <tr>
                        <td class="px-4 py-3 text-slate-200">
                            <a class="hover:text-white" href="{{ $metric->url }}" target="_blank" rel="noopener">{{ $metric->url }}</a>
                        </td>
                        <td class="px-4 py-3 text-slate-300">{{ $metric->page_type }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $metric->views_recent }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $metric->views_previous }}</td>
                        <td class="px-4 py-3 text-slate-400">{{ $metric->last_content_refresh_at?->format('d/m/Y') ?? '-' }}</td>
                        <td class="px-4 py-3">
                            <form method="POST" action="{{ route('admin.seo-decay.refresh', $metric) }}">
                                @csrf
                                <button class="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400/60" type="submit">Refrescar</button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="6">No hay páginas stale actualmente.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</x-layouts.admin>
