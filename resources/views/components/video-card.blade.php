@props([
    'video',
    'variant' => 'dense',
    'showTags' => true,
    'showCategory' => true,
])

{{-- Dense cards: duration + meta always visible; views shown only if available. --}}
@php
    $thumbnail = $video->thumbnail_url ?: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80';
    $tags = $showTags ? array_slice($video->raw_tags ?? [], 0, 2) : [];
    $publishedAt = $video->published_at ?? $video->created_at;
    $timeAgo = $publishedAt ? time_ago($publishedAt) : '';
    $viewsTotal = $video->display_views;
    $formattedViews = $viewsTotal ? format_views($viewsTotal) : null;
    $durationLabel = null;
    if ($video->duration_seconds) {
        $durationLabel = $video->duration_seconds >= 3600
            ? gmdate('H:i:s', $video->duration_seconds)
            : gmdate('i:s', $video->duration_seconds);
    }

    $wrapperClasses = $variant === 'hero'
        ? 'rounded-lg border border-red-600/40 bg-black/80'
        : 'h-full rounded-md border border-red-600/30 bg-slate-950';
@endphp

<article class="overflow-hidden shadow-sm transition hover:border-red-500/70 {{ $wrapperClasses }}">
    <a
        class="flex h-full flex-col"
        href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]) }}"
        aria-label="Watch {{ $video->title }}"
    >
        <div class="relative w-full overflow-hidden bg-black">
            <div class="aspect-video w-full">
                <img
                    src="{{ $thumbnail }}"
                    srcset="{{ $thumbnail }} 320w, {{ $thumbnail }} 640w"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    alt="{{ $video->title }}"
                    class="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    width="320"
                    height="180"
                />
            </div>
            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent"></div>
            @if ($durationLabel)
                <span class="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {{ $durationLabel }}
                </span>
            @endif
        </div>
        <div class="flex flex-1 flex-col gap-1 px-2 py-2">
            <h3 class="line-clamp-2 text-sm font-semibold text-white">
                {{ $video->title }}
            </h3>
            <div class="flex items-center justify-between text-xs text-slate-400">
                <span>{{ $timeAgo }}</span>
                @if ($formattedViews)
                    <span>{{ $formattedViews }} views</span>
                @endif
            </div>
            @if ($showCategory || $tags)
                <div class="flex flex-wrap gap-1 pt-1 text-[11px]">
                    @if ($showCategory && $video->category_slug)
                        <span class="rounded-full border border-red-500/50 px-2 py-0.5 text-red-100">
                            {{ \Illuminate\Support\Str::headline($video->category_slug) }}
                        </span>
                    @endif
                    @foreach ($tags as $tag)
                        <span class="rounded-full bg-white/5 px-2 py-0.5 text-slate-200">#{{ $tag }}</span>
                    @endforeach
                </div>
            @endif
        </div>
    </a>
</article>
