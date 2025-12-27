<x-layouts.admin title="Admin | SEO Opportunities" heading="SEO Opportunities" subheading="Detecta búsquedas internas con potencial SEO">
    <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <form class="flex flex-wrap items-center gap-3 text-sm" method="GET" action="{{ route('admin.seo-opportunities.index') }}">
            <label class="text-slate-300" for="status">Estado</label>
            <select id="status" name="status" class="rounded-md border border-white/10 bg-slate-950 px-3 py-2">
                <option value="" @selected($status === '')>Todos</option>
                <option value="converted" @selected($status === 'converted')>Convertidos</option>
                <option value="ignored" @selected($status === 'ignored')>Ignorados</option>
            </select>
            <button class="rounded-md border border-white/10 px-3 py-2 text-slate-200 hover:border-indigo-400/60" type="submit">Filtrar</button>
        </form>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="w-full text-left text-sm">
            <thead class="border-b border-white/10 text-xs uppercase text-slate-400">
                <tr>
                    <th class="px-4 py-3">Query</th>
                    <th class="px-4 py-3">Frecuencia</th>
                    <th class="px-4 py-3">Resultados</th>
                    <th class="px-4 py-3">Última vez</th>
                    <th class="px-4 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($queries as $query)
                    @php
                        $action = $actions[$query->normalized_query] ?? null;
                        $avgResults = (int) round($query->avg_results ?? 0);
                    @endphp
                    <tr>
                        <td class="px-4 py-3">
                            <div class="font-semibold text-white">{{ $query->query }}</div>
                            <div class="text-xs text-slate-400">{{ $query->normalized_query }}</div>
                            @if ($action)
                                <span class="mt-1 inline-flex rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] uppercase tracking-wide text-emerald-200">
                                    {{ $action->status }}
                                </span>
                            @endif
                        </td>
                        <td class="px-4 py-3 text-slate-300">{{ $query->total }}</td>
                        <td class="px-4 py-3">
                            <span class="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-200">{{ $avgResults }}</span>
                            @if ($avgResults < 3)
                                <span class="ml-2 rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-200">Oportunidad</span>
                            @endif
                        </td>
                        <td class="px-4 py-3 text-slate-400">{{ \Illuminate\Support\Carbon::parse($query->last_seen)->format('d/m/Y') }}</td>
                        <td class="px-4 py-3">
                            <div class="flex flex-wrap gap-2">
                                <form method="POST" action="{{ route('admin.seo-opportunities.mark', $query->normalized_query) }}">
                                    @csrf
                                    <input type="hidden" name="status" value="ignored">
                                    <button class="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-indigo-400/60" type="submit">Ignorar</button>
                                </form>
                                <form method="POST" action="{{ route('admin.seo-opportunities.mark', $query->normalized_query) }}">
                                    @csrf
                                    <input type="hidden" name="status" value="converted">
                                    <button class="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400/60" type="submit">Convertir</button>
                                </form>
                                <form method="POST" action="{{ route('admin.seo-opportunities.create-tag', $query->normalized_query) }}">
                                    @csrf
                                    <button class="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-amber-400/60" type="submit">Crear landing tag</button>
                                </form>
                                <form class="flex flex-wrap items-center gap-2" method="POST" action="{{ route('admin.seo-opportunities.create-landing', $query->normalized_query) }}">
                                    @csrf
                                    <select name="category" class="rounded-md border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-200">
                                        <option value="">Sin categoría</option>
                                        @foreach ($categories as $category)
                                            <option value="{{ $category->slug }}">{{ $category->name }}</option>
                                        @endforeach
                                    </select>
                                    <select name="duration" class="rounded-md border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-200">
                                        <option value="">Duración</option>
                                        @foreach ($durations as $key => $duration)
                                            <option value="{{ $key }}">{{ $duration['label'] }}</option>
                                        @endforeach
                                    </select>
                                    <button class="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-indigo-400/60" type="submit">Crear landing</button>
                                </form>
                                <form method="POST" action="{{ route('admin.seo-opportunities.create-cluster', $query->normalized_query) }}">
                                    @csrf
                                    <button class="rounded-md border border-white/10 px-3 py-1 text-xs text-slate-200 hover:border-emerald-400/60" type="submit">Crear hub</button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="5">No hay queries registradas aún.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>
</x-layouts.admin>
