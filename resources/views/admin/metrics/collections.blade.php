<x-layouts.admin title="Admin | Collection metrics" heading="Collection metrics" subheading="Pageviews últimos 30 días">
    <div class="flex items-center gap-3 text-sm">
        <a class="rounded-lg border border-white/10 px-3 py-2 {{ $filter === '' ? 'bg-white/10' : '' }}" href="{{ route('admin.metrics.collections') }}">Top</a>
        <a class="rounded-lg border border-white/10 px-3 py-2 {{ $filter === 'lowest' ? 'bg-white/10' : '' }}" href="{{ route('admin.metrics.collections', ['filter' => 'lowest']) }}">Menos vistas</a>
        <a class="rounded-lg border border-white/10 px-3 py-2 {{ $filter === 'dormant' ? 'bg-white/10' : '' }}" href="{{ route('admin.metrics.collections', ['filter' => 'dormant']) }}">Dormant</a>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Nombre</th>
                    <th class="px-4 py-3">Slug</th>
                    <th class="px-4 py-3">Visitas 30d</th>
                    <th class="px-4 py-3">Auto</th>
                    <th class="px-4 py-3">Pública</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($collections as $collection)
                    <tr>
                        <td class="px-4 py-3 font-medium">{{ $collection->name }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $collection->slug }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $collection->pageviews_last_30d }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $collection->is_auto_managed ? 'Sí' : 'No' }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $collection->is_public ? 'Sí' : 'No' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="5">Sin datos.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{ $collections->links() }}
</x-layouts.admin>
