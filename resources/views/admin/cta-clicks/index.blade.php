<x-layouts.admin title="Admin | CTA Clicks" heading="CTA Clicks" subheading="Rendimiento de enlaces de monetización">
    <form class="mb-6 grid gap-4 rounded-xl border border-white/10 bg-white/5 p-4 md:grid-cols-3" method="GET" action="{{ route('admin.cta-clicks.index') }}">
        <div>
            <label class="text-xs uppercase text-slate-400" for="start">Desde</label>
            <input id="start" name="start" type="date" value="{{ $filters['start'] ?? '' }}" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </div>
        <div>
            <label class="text-xs uppercase text-slate-400" for="end">Hasta</label>
            <input id="end" name="end" type="date" value="{{ $filters['end'] ?? '' }}" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </div>
        <div class="flex items-end gap-2">
            <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" type="submit">Filtrar</button>
            <a class="text-sm text-slate-400 hover:text-slate-200" href="{{ route('admin.cta-clicks.index') }}">Reset</a>
        </div>
    </form>

    <div class="grid gap-6 lg:grid-cols-2">
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 class="text-sm font-semibold text-white">Rendimiento por CTA</h2>
            <div class="mt-3 overflow-x-auto">
                <table class="min-w-full text-sm text-slate-300">
                    <thead class="text-xs uppercase text-slate-400">
                        <tr>
                            <th class="px-3 py-2 text-left">CTA</th>
                            <th class="px-3 py-2 text-left">Tipo</th>
                            <th class="px-3 py-2 text-left">Posiciones</th>
                            <th class="px-3 py-2 text-right">Impresiones</th>
                            <th class="px-3 py-2 text-right">Clicks</th>
                            <th class="px-3 py-2 text-right">CTR</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($ctaStats as $row)
                            <tr class="border-t border-white/5">
                                <td class="px-3 py-2 uppercase">{{ $row['cta']->key }}</td>
                                <td class="px-3 py-2">{{ $row['cta']->type }}</td>
                                <td class="px-3 py-2 text-xs text-slate-400">
                                    {{ implode(', ', $row['cta']->positions ?? []) ?: '—' }}
                                </td>
                                <td class="px-3 py-2 text-right">{{ $row['impressions'] }}</td>
                                <td class="px-3 py-2 text-right">{{ $row['clicks'] }}</td>
                                <td class="px-3 py-2 text-right">{{ number_format($row['ctr'], 2) }}%</td>
                            </tr>
                        @empty
                            <tr>
                                <td class="px-3 py-2 text-slate-400" colspan="6">Sin datos aún.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 class="text-sm font-semibold text-white">Rendimiento por origen</h2>
            @php
                $originClickMap = $byOriginClicks->groupBy('origin_page');
                $originImpressionMap = $byOriginImpressions->groupBy('origin_page');
                $origins = collect([$originClickMap->keys(), $originImpressionMap->keys()])
                    ->flatten()
                    ->unique()
                    ->filter()
                    ->values();
            @endphp
            <div class="mt-3 space-y-3 text-sm text-slate-300">
                @forelse ($origins as $origin)
                    @php
                        $originClicks = $originClickMap->get($origin, collect())->sum('total');
                        $originImpressions = $originImpressionMap->get($origin, collect())->sum('total');
                        $originCtr = $originImpressions > 0 ? round(($originClicks / $originImpressions) * 100, 2) : 0;
                    @endphp
                    <div class="rounded-lg border border-white/10 px-3 py-2">
                        <div class="flex items-center justify-between">
                            <span class="font-semibold uppercase">{{ $origin }}</span>
                            <span class="text-xs text-slate-400">CTR {{ number_format($originCtr, 2) }}%</span>
                        </div>
                        <div class="mt-1 flex items-center justify-between text-xs text-slate-400">
                            <span>Impresiones: {{ $originImpressions }}</span>
                            <span>Clicks: {{ $originClicks }}</span>
                        </div>
                    </div>
                @empty
                    <p class="text-slate-400">Sin datos aún.</p>
                @endforelse
            </div>
        </div>
    </div>

    <div class="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 class="text-sm font-semibold text-white">Últimos clicks</h2>
        <div class="mt-3 overflow-x-auto">
            <table class="min-w-full text-sm text-slate-300">
                <thead class="text-xs uppercase text-slate-400">
                    <tr>
                        <th class="px-3 py-2 text-left">Fecha</th>
                        <th class="px-3 py-2 text-left">Video</th>
                        <th class="px-3 py-2 text-left">CTA</th>
                        <th class="px-3 py-2 text-left">Origen</th>
                        <th class="px-3 py-2 text-left">Placement</th>
                        <th class="px-3 py-2 text-left">Página</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($latest as $click)
                        <tr class="border-t border-white/5">
                            <td class="px-3 py-2">{{ $click->created_at?->format('d/m/Y H:i') }}</td>
                            <td class="px-3 py-2">#{{ $click->video_id }}</td>
                            <td class="px-3 py-2 uppercase">{{ $click->cta?->key ?? $click->cta_key }}</td>
                            <td class="px-3 py-2">{{ $click->origin_page ?? '-' }}</td>
                            <td class="px-3 py-2">{{ $click->placement ?? '-' }}</td>
                            <td class="px-3 py-2 truncate max-w-xs">{{ $click->page_url ?? '-' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td class="px-3 py-2 text-slate-400" colspan="6">Sin clicks registrados.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</x-layouts.admin>
