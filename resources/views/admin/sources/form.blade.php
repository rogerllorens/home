<x-layouts.admin
    title="Admin | Sources"
    heading="{{ $source->exists ? 'Editar fuente' : 'Nueva fuente' }}"
    subheading="Configura datos y reglas de importación"
>
    <form class="space-y-6" method="POST" action="{{ $route }}">
        @csrf
        @if ($method !== 'post')
            @method('PUT')
        @endif

        <div class="grid gap-4 lg:grid-cols-2">
            <div>
                <label class="text-sm text-slate-300" for="name">Nombre</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    value="{{ old('name', $source->name) }}"
                    class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                    required
                />
            </div>
            <div>
                <label class="text-sm text-slate-300" for="type">Tipo</label>
                <select id="type" name="type" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
                    @foreach ($types as $type)
                        <option value="{{ $type->value }}" @selected(old('type', $source->type?->value) === $type->value)>
                            {{ strtoupper($type->value) }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="text-sm text-slate-300" for="feed_url">Feed URL</label>
                <input
                    id="feed_url"
                    name="feed_url"
                    type="url"
                    value="{{ old('feed_url', $source->feed_url) }}"
                    class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                />
            </div>
            <div>
                <label class="text-sm text-slate-300" for="auth_header">Auth header</label>
                <input
                    id="auth_header"
                    name="auth_header"
                    type="text"
                    value="{{ old('auth_header', $source->auth_header) }}"
                    class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                />
            </div>
            <div>
                <label class="text-sm text-slate-300" for="import_schedule_cron">Cron de importación</label>
                <input
                    id="import_schedule_cron"
                    name="import_schedule_cron"
                    type="text"
                    value="{{ old('import_schedule_cron', $source->import_schedule_cron ?? '0 0 * * *') }}"
                    class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                    required
                />
            </div>
            <div class="flex items-end">
                <div class="space-y-2">
                    <label class="flex items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            name="is_active"
                            value="1"
                            class="rounded border-white/10 bg-slate-950"
                            @checked(old('is_active', $source->is_active ?? true))
                        />
                        Fuente activa
                    </label>
                    <label class="flex items-center gap-2 text-sm text-slate-300">
                        <input
                            type="checkbox"
                            name="is_verified"
                            value="1"
                            class="rounded border-white/10 bg-slate-950"
                            @checked(old('is_verified', $source->is_verified ?? false))
                        />
                        Fuente verificada
                    </label>
                </div>
            </div>
        </div>

        <div>
            <label class="text-sm text-slate-300" for="settings">Settings (JSON)</label>
            <textarea
                id="settings"
                name="settings"
                rows="6"
                class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
            >{{ old('settings', $source->settings ? json_encode($source->settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : '') }}</textarea>
            <p class="mt-2 text-xs text-slate-400">Ayuda: items_path, field mappings, allow_iframe_domains, deny_keywords, allow_categories.</p>
        </div>

        @if ($source->exists)
            <div class="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 class="text-sm font-semibold">Diagnóstico de embeds</h3>
                <p class="mt-2 text-xs text-slate-400">Allowlist actual: {{ $allowlist ? implode(', ', $allowlist) : 'Sin allowlist' }}</p>

                @if ($blockedCount >= 3)
                    <div class="mt-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                        Atención: varios embeds no están permitidos por la allowlist.
                    </div>
                @endif

                <div class="mt-4 overflow-hidden rounded-lg border border-white/10">
                    <table class="min-w-full divide-y divide-white/10 text-xs">
                        <thead class="bg-slate-900/40 text-left text-slate-400">
                            <tr>
                                <th class="px-3 py-2">Video ID</th>
                                <th class="px-3 py-2">Embed host</th>
                                <th class="px-3 py-2">Status</th>
                                <th class="px-3 py-2">Allowed</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-white/5">
                            @forelse ($diagnostics as $row)
                                <tr>
                                    <td class="px-3 py-2">{{ $row['id'] }}</td>
                                    <td class="px-3 py-2">{{ $row['host'] ?? '-' }}</td>
                                    <td class="px-3 py-2">{{ $row['status'] }}</td>
                                    <td class="px-3 py-2">
                                        <span class="{{ $row['allowed'] ? 'text-emerald-300' : 'text-rose-300' }}">
                                            {{ $row['allowed'] ? 'Sí' : 'No' }}
                                        </span>
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td class="px-3 py-3 text-center text-slate-400" colspan="4">Sin videos recientes.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        @endif

        <div class="flex items-center gap-3">
            <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" type="submit">Guardar</button>
            <a class="text-sm text-slate-400 hover:text-slate-200" href="{{ route('admin.sources.index') }}">Cancelar</a>
        </div>
    </form>
</x-layouts.admin>
