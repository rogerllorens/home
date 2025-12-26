@props([
    'slotName',
])

@php
    $adsEnabled = (bool) config('ads.enabled', false);
    $slot = config("ads.slots.{$slotName}");
    $slotEnabled = (bool) ($slot['enabled'] ?? false);
    $snippet = trim((string) ($slot['html'] ?? ''));
@endphp

@if ($adsEnabled && $slotEnabled && $snippet !== '')
    <div class="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        <!-- ad slot: {{ $slotName }} -->
        {!! $snippet !!}
    </div>
@endif
