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

        <div class="flex items-center gap-3">
            <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" type="submit">Guardar</button>
            <a class="text-sm text-slate-400 hover:text-slate-200" href="{{ route('admin.sources.index') }}">Cancelar</a>
        </div>
    </form>
</x-layouts.admin>
