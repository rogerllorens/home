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
            <h2 class="text-sm font-semibold text-white">Clicks por CTA</h2>
            <div class="mt-3 space-y-2 text-sm text-slate-300">
                @forelse ($summary as $row)
                    <div class="flex items-center justify-between">
                        <span class="uppercase">{{ $row->cta_key }}</span>
                        <span class="font-semibold text-white">{{ $row->total }}</span>
                    </div>
                @empty
                    <p class="text-slate-400">Sin clicks aún.</p>
                @endforelse
            </div>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 class="text-sm font-semibold text-white">Clicks por categoría</h2>
            <div class="mt-3 space-y-2 text-sm text-slate-300">
                @forelse ($byCategory as $row)
                    <div class="flex items-center justify-between">
                        <span>{{ $row->category_slug ?? 'N/A' }} · {{ strtoupper($row->cta_key) }}</span>
                        <span class="font-semibold text-white">{{ $row->total }}</span>
                    </div>
                @empty
                    <p class="text-slate-400">Sin datos.</p>
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
                        <th class="px-3 py-2 text-left">Placement</th>
                        <th class="px-3 py-2 text-left">Referrer</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($latest as $click)
                        <tr class="border-t border-white/5">
                            <td class="px-3 py-2">{{ $click->created_at?->format('d/m/Y H:i') }}</td>
                            <td class="px-3 py-2">#{{ $click->video_id }}</td>
                            <td class="px-3 py-2 uppercase">{{ $click->cta_key }}</td>
                            <td class="px-3 py-2">{{ $click->placement ?? '-' }}</td>
                            <td class="px-3 py-2 truncate max-w-xs">{{ $click->referrer ?? '-' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td class="px-3 py-2 text-slate-400" colspan="5">Sin clicks registrados.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </div>
</x-layouts.admin>
