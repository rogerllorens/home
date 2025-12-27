<x-layouts.admin title="Admin | SEO Variants" heading="SEO Variants" subheading="Rotación y rendimiento de títulos y descripciones">
    <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <form class="flex flex-wrap items-center gap-3 text-sm" method="GET" action="{{ route('admin.seo-meta-variants.index') }}">
            <label class="text-slate-300" for="page_type">Tipo de página</label>
            <input id="page_type" name="page_type" value="{{ $pageType }}" class="rounded-md border border-white/10 bg-slate-950 px-3 py-2" placeholder="category, tag, theme..." />
            <button class="rounded-md border border-white/10 px-3 py-2 text-slate-200 hover:border-indigo-400/60" type="submit">Filtrar</button>
        </form>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="w-full text-left text-sm">
            <thead class="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                    <th class="px-4 py-3">Página</th>
                    <th class="px-4 py-3">Título</th>
                    <th class="px-4 py-3">Descripción</th>
                    <th class="px-4 py-3">Impresiones</th>
                    <th class="px-4 py-3">Orgánico</th>
                    <th class="px-4 py-3">Estado</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($variants as $variant)
                    <tr>
                        <td class="px-4 py-3">
                            <div class="font-semibold text-white">{{ $variant->page_type }}</div>
                            <div class="text-xs text-slate-400">ID: {{ $variant->page_id ?? 'n/a' }}</div>
                        </td>
                        <td class="px-4 py-3 text-slate-200">{{ $variant->title }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $variant->description }}</td>
                        <td class="px-4 py-3 text-slate-200">{{ $stats[$variant->id] ?? 0 }}</td>
                        <td class="px-4 py-3 text-slate-200">{{ $organicStats[$variant->id] ?? 0 }}</td>
                        <td class="px-4 py-3">
                            @if ($variant->is_winner)
                                <span class="rounded-full bg-emerald-500/20 px-2 py-1 text-xs text-emerald-200">Ganadora</span>
                            @else
                                <form method="POST" action="{{ route('admin.seo-meta-variants.winner', $variant) }}">
                                    @csrf
                                    <button class="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400/60" type="submit">Marcar ganadora</button>
                                </form>
                            @endif
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="6">No hay variantes registradas.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</x-layouts.admin>
