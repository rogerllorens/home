<x-layouts.admin title="Admin | Takedowns públicos" heading="Solicitudes públicas" subheading="Revisión y seguimiento de solicitudes de retirada">
    <form class="mb-6 flex flex-wrap gap-4 rounded-xl border border-white/10 bg-white/5 p-4" method="GET" action="{{ route('admin.public-takedowns.index') }}">
        <div>
            <label class="text-xs uppercase text-slate-400" for="status">Status</label>
            <select id="status" name="status" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
                <option value="">Todos</option>
                @foreach ($statuses as $status)
                    <option value="{{ $status->value }}" @selected(($filters['status'] ?? '') === $status->value)>
                        {{ strtoupper($status->value) }}
                    </option>
                @endforeach
            </select>
        </div>
        <div class="flex items-end gap-2">
            <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" type="submit">Filtrar</button>
            <a class="text-sm text-slate-400 hover:text-slate-200" href="{{ route('admin.public-takedowns.index') }}">Reset</a>
        </div>
    </form>

    <div class="overflow-hidden rounded-xl border border-white/10">
        <table class="min-w-full divide-y divide-white/10 text-sm">
            <thead class="bg-slate-900/40">
                <tr class="text-left text-xs uppercase text-slate-400">
                    <th class="px-4 py-3">Fecha</th>
                    <th class="px-4 py-3">URL afectada</th>
                    <th class="px-4 py-3">Contacto</th>
                    <th class="px-4 py-3">Motivo</th>
                    <th class="px-4 py-3">Estado</th>
                    <th class="px-4 py-3">Acciones</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
                @forelse ($requests as $request)
                    <tr>
                        <td class="px-4 py-3">{{ $request->created_at?->format('d/m/Y H:i') }}</td>
                        <td class="px-4 py-3 max-w-xs truncate">
                            <a class="text-indigo-300 hover:text-indigo-200" href="{{ $request->url }}" target="_blank" rel="noopener">
                                {{ $request->url }}
                            </a>
                        </td>
                        <td class="px-4 py-3">
                            <div class="text-xs text-slate-400">{{ $request->requester_name ?? '—' }}</div>
                            <div>{{ $request->email }}</div>
                        </td>
                        <td class="px-4 py-3 max-w-sm truncate">{{ $request->reason ?? '—' }}</td>
                        <td class="px-4 py-3 uppercase text-xs">{{ $request->status?->value ?? '-' }}</td>
                        <td class="px-4 py-3">
                            <form method="POST" action="{{ route('admin.public-takedowns.update', $request) }}" class="flex items-center gap-2">
                                @csrf
                                @method('PUT')
                                <select name="status" class="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs">
                                    @foreach ($statuses as $status)
                                        <option value="{{ $status->value }}" @selected($request->status?->value === $status->value)>
                                            {{ strtoupper($status->value) }}
                                        </option>
                                    @endforeach
                                </select>
                                <button class="rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100" type="submit">Guardar</button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td class="px-4 py-6 text-center text-sm text-slate-400" colspan="6">No hay solicitudes.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="mt-4">
        {{ $requests->links() }}
    </div>
</x-layouts.admin>
