<x-layouts.admin
    title="Admin | Journeys"
    heading="{{ $journey->exists ? 'Editar journey' : 'Nuevo journey' }}"
    subheading="Construye rutas temáticas con orden"
>
    <form class="space-y-6" method="GET" action="">
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 class="text-sm font-semibold text-white">Buscar videos</h3>
            <div class="mt-3 flex flex-wrap gap-3">
                <input
                    name="q"
                    type="text"
                    value="{{ $filters['q'] ?? '' }}"
                    placeholder="Buscar por título o ID"
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm lg:max-w-sm"
                />
                <input
                    name="category_slug"
                    type="text"
                    value="{{ $filters['category_slug'] ?? '' }}"
                    placeholder="Categoría"
                    class="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm lg:max-w-xs"
                />
                <button class="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200 hover:border-white/30" type="submit">Buscar</button>
            </div>
        </div>
    </form>

    <form class="space-y-6" method="POST" action="{{ $journey->exists ? route('admin.journeys.update', $journey) : route('admin.journeys.store') }}">
        @csrf
        @if ($journey->exists)
            @method('PUT')
        @endif

        <div class="grid gap-4 lg:grid-cols-2">
            <div>
                <label class="text-sm text-slate-300" for="title">Título</label>
                <input
                    id="title"
                    name="title"
                    type="text"
                    value="{{ old('title', $journey->title) }}"
                    class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                    required
                />
            </div>
            <div>
                <label class="text-sm text-slate-300" for="slug">Slug</label>
                <input
                    id="slug"
                    name="slug"
                    type="text"
                    value="{{ old('slug', $journey->slug) }}"
                    class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                />
            </div>
            <div class="lg:col-span-2">
                <label class="text-sm text-slate-300" for="description">Descripción</label>
                <textarea
                    id="description"
                    name="description"
                    rows="3"
                    class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                >{{ old('description', $journey->description) }}</textarea>
            </div>
            <div>
                <label class="text-sm text-slate-300" for="status">Estado</label>
                <select id="status" name="status" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
                    @foreach ($statuses as $status)
                        <option value="{{ $status->value }}" @selected(old('status', $journey->status?->value ?? $journey->status) === $status->value)>
                            {{ ucfirst($status->value) }}
                        </option>
                    @endforeach
                </select>
            </div>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 class="text-sm font-semibold text-white">Videos seleccionados</h3>
            <p class="mt-2 text-xs text-slate-400">Define el orden con el campo de posición.</p>
            <div class="mt-4 space-y-3">
                @forelse ($selectedVideos as $video)
                    <div class="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 px-3 py-2">
                        <input type="checkbox" name="videos[{{ $video->id }}]" value="1" class="h-4 w-4 rounded border-white/10 bg-slate-950" checked>
                        <div class="flex-1 text-sm text-slate-200">
                            <span class="font-semibold">{{ $video->title }}</span>
                            <span class="text-xs text-slate-400">#{{ $video->id }}</span>
                        </div>
                        <input
                            type="number"
                            name="positions[{{ $video->id }}]"
                            value="{{ old("positions.{$video->id}", $video->pivot->position ?? '') }}"
                            class="w-24 rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                            placeholder="Orden"
                        />
                    </div>
                @empty
                    <p class="text-sm text-slate-400">No hay videos seleccionados.</p>
                @endforelse
            </div>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 class="text-sm font-semibold text-white">Resultados de búsqueda</h3>
            <p class="mt-2 text-xs text-slate-400">Usa el buscador superior y selecciona videos en el listado.</p>
            <div class="mt-4 space-y-3">
                @forelse ($searchResults as $video)
                    <div class="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 px-3 py-2">
                        <input type="checkbox" name="videos[{{ $video->id }}]" value="1" class="h-4 w-4 rounded border-white/10 bg-slate-950" @checked($selectedVideos->contains('id', $video->id))>
                        <div class="flex-1 text-sm text-slate-200">
                            <span class="font-semibold">{{ $video->title }}</span>
                            <span class="text-xs text-slate-400">#{{ $video->id }}</span>
                        </div>
                        <input
                            type="number"
                            name="positions[{{ $video->id }}]"
                            value="{{ old("positions.{$video->id}") }}"
                            class="w-24 rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-200"
                            placeholder="Orden"
                        />
                    </div>
                @empty
                    <p class="text-sm text-slate-400">No hay resultados.</p>
                @endforelse
            </div>
        </div>

        <div class="flex items-center gap-3">
            <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" type="submit">Guardar</button>
            <a class="text-sm text-slate-400 hover:text-slate-200" href="{{ route('admin.journeys.index') }}">Cancelar</a>
        </div>
    </form>
</x-layouts.admin>
