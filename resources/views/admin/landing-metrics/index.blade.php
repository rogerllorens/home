<x-layouts.admin title="Admin | Landing metrics" heading="Landing metrics" subheading="Rendimiento de landings SEO (últimos 30 días)">
    <section class="space-y-4">
        <h2 class="text-lg font-semibold">🚀 Rising</h2>
        <div class="overflow-hidden rounded-xl border border-white/10">
            <table class="min-w-full divide-y divide-white/10 text-sm">
                <thead class="bg-slate-900/40">
                    <tr class="text-left text-xs uppercase text-slate-400">
                        <th class="px-4 py-3">Landing</th>
                        <th class="px-4 py-3">Slug</th>
                        <th class="px-4 py-3">30d</th>
                        <th class="px-4 py-3">Prev 30d</th>
                        <th class="px-4 py-3">Δ</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    @forelse ($rising as $row)
                        <tr>
                            <td class="px-4 py-3 font-medium">{{ $row->landing->title }}</td>
                            <td class="px-4 py-3 text-slate-300">{{ $row->landing->slug }}</td>
                            <td class="px-4 py-3 text-slate-300">{{ $row->current }}</td>
                            <td class="px-4 py-3 text-slate-300">{{ $row->previous }}</td>
                            <td class="px-4 py-3 text-emerald-300">+{{ $row->delta }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="5">Sin datos.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <section class="space-y-4">
        <h2 class="text-lg font-semibold">⚠️ Declining</h2>
        <div class="overflow-hidden rounded-xl border border-white/10">
            <table class="min-w-full divide-y divide-white/10 text-sm">
                <thead class="bg-slate-900/40">
                    <tr class="text-left text-xs uppercase text-slate-400">
                        <th class="px-4 py-3">Landing</th>
                        <th class="px-4 py-3">Slug</th>
                        <th class="px-4 py-3">30d</th>
                        <th class="px-4 py-3">Prev 30d</th>
                        <th class="px-4 py-3">Δ</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    @forelse ($declining as $row)
                        <tr>
                            <td class="px-4 py-3 font-medium">{{ $row->landing->title }}</td>
                            <td class="px-4 py-3 text-slate-300">{{ $row->landing->slug }}</td>
                            <td class="px-4 py-3 text-slate-300">{{ $row->current }}</td>
                            <td class="px-4 py-3 text-slate-300">{{ $row->previous }}</td>
                            <td class="px-4 py-3 text-rose-300">{{ $row->delta }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="5">Sin datos.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <section class="space-y-4">
        <h2 class="text-lg font-semibold">💤 Dormant</h2>
        <div class="overflow-hidden rounded-xl border border-white/10">
            <table class="min-w-full divide-y divide-white/10 text-sm">
                <thead class="bg-slate-900/40">
                    <tr class="text-left text-xs uppercase text-slate-400">
                        <th class="px-4 py-3">Landing</th>
                        <th class="px-4 py-3">Slug</th>
                        <th class="px-4 py-3">30d</th>
                        <th class="px-4 py-3">Prev 30d</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    @forelse ($dormant as $row)
                        <tr>
                            <td class="px-4 py-3 font-medium">{{ $row->landing->title }}</td>
                            <td class="px-4 py-3 text-slate-300">{{ $row->landing->slug }}</td>
                            <td class="px-4 py-3 text-slate-300">{{ $row->current }}</td>
                            <td class="px-4 py-3 text-slate-300">{{ $row->previous }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="4">Sin datos.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
    </section>
</x-layouts.admin>
