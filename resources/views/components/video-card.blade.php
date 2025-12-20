@props(['video'])

@php
    $thumbnail = $video->thumbnail_url ?: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80';
    $tags = array_slice($video->raw_tags ?? [], 0, 2);
@endphp

<article class="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-400/40">
    <a href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]) }}">
        <div class="relative w-full overflow-hidden bg-slate-800/60">
            <div class="aspect-video w-full">
                <img
                    src="{{ $thumbnail }}"
                    alt="{{ $video->title }}"
                    class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    loading="lazy"
                />
            </div>
            @if ($video->duration_seconds)
                <span class="absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-100">
                    {{ gmdate('i:s', $video->duration_seconds) }}
                </span>
            @endif
        </div>
        <div class="space-y-4 px-4 py-5">
            <h3 class="text-base font-semibold text-white">
                {{ $video->title }}
            </h3>
            <div class="flex flex-wrap gap-2 text-xs">
                @if ($video->category_slug)
                    <span class="rounded-full bg-indigo-500/10 px-3 py-1 font-medium text-indigo-200">
                        {{ \Illuminate\Support\Str::headline($video->category_slug) }}
                    </span>
                @endif
                @foreach ($tags as $tag)
                    <span class="rounded-full bg-slate-700/40 px-3 py-1 font-medium text-slate-200">#{{ $tag }}</span>
                @endforeach
            </div>
        </div>
    </a>
</article>
