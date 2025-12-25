<x-layouts.admin title="Admin | Video" heading="Detalle de video" subheading="Acciones y metadata">
    <div class="grid gap-4 lg:grid-cols-3">
        <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm lg:col-span-2">
            <h2 class="text-base font-semibold">{{ $video->title }}</h2>
            <p class="mt-2 text-slate-400">{{ $video->description ?? 'Sin descripción' }}</p>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                    <p class="text-xs uppercase text-slate-400">Status</p>
                    <p class="mt-1 font-semibold">{{ $video->status->value }}</p>
                </div>
                <div>
                    <p class="text-xs uppercase text-slate-400">Source</p>
                    <p class="mt-1">{{ $video->source?->name ?? '-' }}</p>
                </div>
                <div>
                    <p class="text-xs uppercase text-slate-400">Category</p>
                    <p class="mt-1">{{ $video->category_slug ?? '-' }}</p>
                </div>
                <div>
                    <p class="text-xs uppercase text-slate-400">Embed OK</p>
                    <p class="mt-1">{{ $video->embed_ok ? 'Sí' : 'No' }}</p>
                </div>
            </div>
            <div class="mt-4">
                <p class="text-xs uppercase text-slate-400">Embed URL</p>
                <p class="mt-1 break-all text-indigo-200">{{ $video->embed_url }}</p>
            </div>
        </div>

        <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
            <p class="text-xs uppercase text-slate-400">Acciones</p>
            <div class="mt-3 space-y-2">
                <form method="POST" action="{{ route('admin.videos.publish', $video) }}">
                    @csrf
                    <button class="w-full rounded-lg bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-100" type="submit">Publicar</button>
                </form>
                <form method="POST" action="{{ route('admin.videos.unpublish', $video) }}">
                    @csrf
                    <button class="w-full rounded-lg bg-slate-500/20 px-3 py-2 text-xs font-semibold text-slate-100" type="submit">Despublicar</button>
                </form>
                <form method="POST" action="{{ route('admin.videos.regenerate-ai', $video) }}">
                    @csrf
                    <button class="w-full rounded-lg bg-indigo-500/20 px-3 py-2 text-xs font-semibold text-indigo-100" type="submit">Regenerar SEO (IA)</button>
                </form>
                <form method="POST" action="{{ route('admin.videos.mark-broken', $video) }}" onsubmit="return confirm('¿Marcar como roto?');">
                    @csrf
                    <button class="w-full rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-100" type="submit">Marcar roto</button>
                </form>
            </div>
        </div>
    </div>

    <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
        <h3 class="text-sm font-semibold">Takedowns</h3>
        <div class="mt-3 space-y-2">
            @forelse ($video->takedowns as $takedown)
                <div class="rounded-lg border border-white/10 px-3 py-2">
                    <p class="text-xs uppercase text-slate-400">{{ $takedown->status->value }}</p>
                    <p class="mt-1 text-sm">{{ $takedown->reason ?? 'Sin razón' }}</p>
                </div>
            @empty
                <p class="text-sm text-slate-400">No hay takedowns asociados.</p>
            @endforelse
        </div>
    </div>
</x-layouts.admin>
