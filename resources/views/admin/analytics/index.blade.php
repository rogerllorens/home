@php
    $title = 'Analytics overview';
@endphp

<x-layouts.admin title="{{ $title }}">
    <div class="space-y-6">
        <div class="rounded-md border border-white/10 bg-white/5 p-4">
            <h1 class="text-2xl font-semibold text-white">Analytics</h1>
            <p class="mt-2 text-sm text-slate-300">Últimos 7 días de eventos clave.</p>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-md border border-white/10 bg-white/5 p-4">
                <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Video plays</h2>
                <p class="mt-2 text-2xl font-semibold text-white">{{ $videoPlays }}</p>
            </div>
            <div class="rounded-md border border-white/10 bg-white/5 p-4">
                <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Video completed</h2>
                <p class="mt-2 text-2xl font-semibold text-white">{{ $videoCompleted }}</p>
            </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
            <div class="rounded-md border border-white/10 bg-white/5 p-4">
                <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Top events</h2>
                <div class="mt-3 space-y-2 text-sm text-slate-200">
                    @forelse ($topEvents as $event)
                        <div class="flex items-center justify-between">
                            <span>{{ $event->event_name }}</span>
                            <span class="font-semibold text-white">{{ $event->total }}</span>
                        </div>
                    @empty
                        <p class="text-slate-400">No events yet.</p>
                    @endforelse
                </div>
            </div>
            <div class="rounded-md border border-white/10 bg-white/5 p-4">
                <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-400">Top CTA clicks</h2>
                <div class="mt-3 space-y-2 text-sm text-slate-200">
                    @forelse ($ctaClicks as $cta)
                        <div class="flex items-center justify-between">
                            <span>{{ $cta->label ?? 'Unknown' }}</span>
                            <span class="font-semibold text-white">{{ $cta->total }}</span>
                        </div>
                    @empty
                        <p class="text-slate-400">No CTA clicks yet.</p>
                    @endforelse
                </div>
            </div>
        </div>
    </div>
</x-layouts.admin>
