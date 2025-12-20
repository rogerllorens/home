<x-layouts.admin
    title="Admin | Takedowns"
    heading="{{ $takedown->exists ? 'Editar takedown' : 'Nuevo takedown' }}"
    subheading="Gestión rápida de solicitudes"
>
    <form class="space-y-6" method="POST" action="{{ $route }}">
        @csrf
        @if ($method !== 'post')
            @method('PUT')
        @endif

        <div class="grid gap-4 lg:grid-cols-2">
            <div>
                <label class="text-sm text-slate-300" for="video_id">Video</label>
                <select id="video_id" name="video_id" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
                    @foreach ($videos as $video)
                        <option value="{{ $video->id }}" @selected(old('video_id', $takedown->video_id) == $video->id)>
                            {{ $video->title }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="text-sm text-slate-300" for="status">Status</label>
                <select id="status" name="status" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">
                    @foreach ($statuses as $status)
                        <option value="{{ $status->value }}" @selected(old('status', $takedown->status?->value) === $status->value)>
                            {{ strtoupper($status->value) }}
                        </option>
                    @endforeach
                </select>
            </div>
            <div>
                <label class="text-sm text-slate-300" for="requested_at">Fecha solicitud</label>
                <input
                    id="requested_at"
                    name="requested_at"
                    type="date"
                    value="{{ old('requested_at', optional($takedown->requested_at)->toDateString()) }}"
                    class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                />
            </div>
            <div>
                <label class="text-sm text-slate-300" for="resolved_at">Fecha resolución</label>
                <input
                    id="resolved_at"
                    name="resolved_at"
                    type="date"
                    value="{{ old('resolved_at', optional($takedown->resolved_at)->toDateString()) }}"
                    class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                />
            </div>
        </div>

        <div>
            <label class="text-sm text-slate-300" for="reason">Razón</label>
            <textarea id="reason" name="reason" rows="3" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{{ old('reason', $takedown->reason) }}</textarea>
        </div>
        <div>
            <label class="text-sm text-slate-300" for="notes">Notas internas</label>
            <textarea id="notes" name="notes" rows="3" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm">{{ old('notes', $takedown->notes) }}</textarea>
        </div>

        <div class="flex items-center gap-3">
            <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white" type="submit">Guardar</button>
            <a class="text-sm text-slate-400 hover:text-slate-200" href="{{ route('admin.takedowns.index') }}">Cancelar</a>
        </div>
    </form>
</x-layouts.admin>
