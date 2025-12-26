<x-layouts.admin
    title="Admin | Collections"
    heading="{{ $collection->exists ? 'Editar colección' : 'Nueva colección' }}"
    subheading="Crea listas curadas y asigna videos por ID"
>
    <form class="space-y-6 rounded-xl border border-white/10 bg-white/5 p-6" method="POST" action="{{ $collection->exists ? route('admin.collections.update', $collection) : route('admin.collections.store') }}">
        @csrf
        @if ($collection->exists)
            @method('PUT')
        @endif

        <div>
            <label class="text-sm text-slate-300" for="name">Nombre</label>
            <input id="name" name="name" type="text" value="{{ old('name', $collection->name) }}" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" required>
            @error('name')
                <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
            @enderror
        </div>

        <div>
            <label class="text-sm text-slate-300" for="slug">Slug</label>
            <input id="slug" name="slug" type="text" value="{{ old('slug', $collection->slug) }}" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">
            <p class="mt-1 text-xs text-slate-400">Si lo dejas vacío se genera automáticamente.</p>
        </div>

        <div>
            <label class="text-sm text-slate-300" for="description">Descripción</label>
            <textarea id="description" name="description" rows="4" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">{{ old('description', $collection->description) }}</textarea>
        </div>

        <div>
            <label class="text-sm text-slate-300" for="language">Idioma</label>
            <select id="language" name="language" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                @foreach (['en' => 'English', 'es' => 'Español'] as $value => $label)
                    <option value="{{ $value }}" @selected(old('language', $collection->language ?? 'en') === $value)>{{ $label }}</option>
                @endforeach
            </select>
        </div>

        <div class="flex items-center gap-2">
            <input id="is_auto_managed" name="is_auto_managed" type="checkbox" value="1" class="h-4 w-4 rounded border-white/10 bg-slate-950" {{ old('is_auto_managed', $collection->is_auto_managed) ? 'checked' : '' }}>
            <label class="text-sm text-slate-300" for="is_auto_managed">Auto-managed</label>
        </div>

        <div class="flex items-center gap-2">
            <input id="is_public" name="is_public" type="checkbox" value="1" class="h-4 w-4 rounded border-white/10 bg-slate-950" {{ old('is_public', $collection->is_public) ? 'checked' : '' }}>
            <label class="text-sm text-slate-300" for="is_public">Visible en el sitio</label>
        </div>

        <div class="rounded-lg border border-white/10 bg-slate-950/60 p-4">
            <h2 class="text-sm font-semibold text-slate-200">Buscar vídeos</h2>
            <div class="mt-3 grid gap-3 md:grid-cols-[2fr,1fr,auto]">
                <input name="q" type="text" placeholder="Buscar por título o ID" value="{{ $filters['q'] ?? '' }}" class="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <input name="category_slug" type="text" placeholder="Categoría" value="{{ $filters['category_slug'] ?? '' }}" class="rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">
                <button class="rounded-lg border border-white/10 px-3 py-2 text-sm" type="submit" formaction="{{ $collection->exists ? route('admin.collections.edit', $collection) : route('admin.collections.create') }}" formmethod="GET">
                    Buscar
                </button>
            </div>
            @if ($searchResults->isNotEmpty())
                <div class="mt-4 space-y-2">
                    @foreach ($searchResults as $video)
                        <div class="flex items-center gap-3 text-sm">
                            <input id="video-{{ $video->id }}" type="checkbox" name="videos[{{ $video->id }}]" value="1" class="h-4 w-4 rounded border-white/10 bg-slate-950" {{ $selectedVideos->contains('id', $video->id) ? 'checked' : '' }}>
                            <label for="video-{{ $video->id }}" class="flex-1 text-slate-200">{{ $video->title ?: 'Video #' . $video->id }}</label>
                            <input type="number" name="positions[{{ $video->id }}]" value="{{ optional($selectedVideos->firstWhere('id', $video->id))->pivot->position }}" class="w-20 rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-100" placeholder="Pos">
                        </div>
                    @endforeach
                </div>
            @else
                <p class="mt-3 text-sm text-slate-500">No hay resultados de búsqueda.</p>
            @endif
        </div>

        @if ($selectedVideos->isNotEmpty())
            <div class="rounded-lg border border-white/10 bg-slate-950/60 p-4">
                <h2 class="text-sm font-semibold text-slate-200">Vídeos seleccionados</h2>
                <div class="mt-3 space-y-2">
                    @foreach ($selectedVideos as $video)
                        <div class="flex items-center gap-3 text-sm">
                            <input id="selected-{{ $video->id }}" type="checkbox" name="videos[{{ $video->id }}]" value="1" class="h-4 w-4 rounded border-white/10 bg-slate-950" checked>
                            <label for="selected-{{ $video->id }}" class="flex-1 text-slate-200">{{ $video->title ?: 'Video #' . $video->id }}</label>
                            <input type="number" name="positions[{{ $video->id }}]" value="{{ $video->pivot->position }}" class="w-20 rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-100" placeholder="Pos">
                        </div>
                    @endforeach
                </div>
            </div>
        @endif

        <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400" type="submit">
            Guardar
        </button>
    </form>
</x-layouts.admin>
