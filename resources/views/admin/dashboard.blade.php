<x-layouts.admin title="Admin | Dashboard" heading="Dashboard" subheading="Resumen rápido del estado">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase text-slate-400">Sources</p>
            <p class="mt-2 text-2xl font-semibold">{{ $sourcesCount }}</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase text-slate-400">Videos</p>
            <p class="mt-2 text-2xl font-semibold">{{ $videosCount }}</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase text-slate-400">Takedowns</p>
            <p class="mt-2 text-2xl font-semibold">{{ $takedownsCount }}</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-white/5 p-4">
            <p class="text-xs uppercase text-slate-400">Import runs recientes</p>
            <p class="mt-2 text-2xl font-semibold">{{ $recentRuns->count() }}</p>
        </div>
    </div>

    <div class="rounded-xl border border-white/10 bg-white/5 p-4">
        <h2 class="text-sm font-semibold">Latest import runs</h2>
        <div class="mt-4 space-y-2">
            @forelse ($recentRuns as $run)
                <div class="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm">
                    <div>
                        <p class="font-medium">{{ $run->source?->name ?? 'Sin fuente' }}</p>
                        <p class="text-xs text-slate-400">{{ $run->status->value }} · {{ $run->created_at?->format('d/m/Y H:i') }}</p>
                    </div>
                    <a class="text-indigo-300 hover:text-indigo-200" href="{{ route('admin.import-runs.show', $run) }}">View</a>
                </div>
            @empty
                <p class="text-sm text-slate-400">No hay import runs aún.</p>
            @endforelse
        </div>
    </div>
</x-layouts.admin>
