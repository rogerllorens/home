<x-layouts.admin title="Admin | Landing metrics" heading="Landing metrics" subheading="Pageviews últimos 30 días">
    <div class="flex items-center gap-3 text-sm">
        <a class="rounded-lg border border-white/10 px-3 py-2 {{ $filter === '' ? 'bg-white/10' : '' }}" href="{{ route('admin.metrics.landings') }}">Top</a>
        <a class="rounded-lg border border-white/10 px-3 py-2 {{ $filter === 'lowest' ? 'bg-white/10' : '' }}" href="{{ route('admin.metrics.landings', ['filter' => 'lowest']) }}">Menos vistas</a>
        <a class="rounded-lg border border-white/10 px-3 py-2 {{ $filter === 'dormant' ? 'bg-white/10' : '' }}" href="{{ route('admin.metrics.landings', ['filter' => 'dormant']) }}">Dormant</a>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Título</th>
                    <th class="px-4 py-3">Slug</th>
                    <th class="px-4 py-3">Visitas 30d</th>
                    <th class="px-4 py-3">Pública</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($landings as $landing)
                    <tr>
                        <td class="px-4 py-3 font-medium">{{ $landing->title }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $landing->slug }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $landing->pageviews_last_30d }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $landing->is_public ? 'Sí' : 'No' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="4">Sin datos.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{ $landings->links() }}
</x-layouts.admin>
