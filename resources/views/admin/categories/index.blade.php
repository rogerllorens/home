<x-layouts.admin title="Admin | Categories" heading="Categories" subheading="Categorías manuales y auto-managed">
    <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-slate-400">{{ $categories->total() }} categorías</div>
        <form method="GET" class="flex items-center gap-2 text-sm">
            <label class="text-slate-400" for="auto-filter">Auto-managed</label>
            <select id="auto-filter" name="auto_managed" class="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm">
                <option value="0" @selected(!$onlyAuto)>Todas</option>
                <option value="1" @selected($onlyAuto)>Sólo auto-managed</option>
            </select>
            <button class="rounded-lg border border-white/10 px-3 py-2 text-sm" type="submit">Filtrar</button>
        </form>
    </div>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Nombre</th>
                    <th class="px-4 py-3">Slug</th>
                    <th class="px-4 py-3">Auto</th>
                    <th class="px-4 py-3">Pública</th>
                    <th class="px-4 py-3">Vídeos</th>
                    <th class="px-4 py-3">Visitas 30d</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($categories as $category)
                    <tr>
                        <td class="px-4 py-3 font-medium">{{ $category->name }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $category->slug }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $category->is_auto_managed ? 'Sí' : 'No' }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $category->is_public ? 'Sí' : 'No' }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $category->videos()->count() }}</td>
                        <td class="px-4 py-3 text-slate-300">{{ $views[$category->id] ?? 0 }}</td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="6">No hay categorías.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div>
        {{ $categories->links() }}
    </div>
</x-layouts.admin>
