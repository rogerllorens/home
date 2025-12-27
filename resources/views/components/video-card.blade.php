@props([
    'video',
    'variant' => 'dense',
    'showTags' => true,
    'showCategory' => true,
])

{{-- Dense cards: duration + meta visible; views shown only if available. --}}
@php
    $thumbnail = $video->thumbnail_url ?: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80';
    $tags = $showTags ? array_slice($video->raw_tags ?? [], 0, 2) : [];
    $publishedAt = $video->published_at ?? $video->created_at;
    $timeAgo = $publishedAt ? time_ago($publishedAt) : '';
    $isNew = $publishedAt ? $publishedAt->gt(now()->subHours(48)) : false;
    $viewsTotal = $video->display_views;
    $formattedViews = $viewsTotal ? format_views($viewsTotal) : null;
    $likesTotal = $video->display_likes;
    $formattedLikes = $likesTotal !== null ? format_views($likesTotal) : null;
    $durationLabel = null;
    if ($video->duration_seconds) {
        $durationLabel = $video->duration_seconds >= 3600
            ? gmdate('H:i:s', $video->duration_seconds)
            : gmdate('i:s', $video->duration_seconds);
    }

    $wrapperClasses = $variant === 'hero'
        ? 'rounded-lg border border-red-600/40 bg-black/80'
        : 'h-full rounded-md border border-white/10 bg-slate-950';
@endphp

<article class="group overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-red-500/70 hover:shadow-lg hover:shadow-black/40 focus-within:-translate-y-0.5 focus-within:border-red-400/70 focus-within:shadow-lg focus-within:shadow-black/40 {{ $wrapperClasses }}">
    <a
        class="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
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
            <div class="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
                <span class="rounded-full bg-black/70 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                    Play
                </span>
            </div>
            @if ($durationLabel)
                <span class="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {{ $durationLabel }}
                </span>
            @endif
            @if ($isNew)
                <span class="absolute left-2 top-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-950">
                    New
                </span>
            @endif
        </div>
        <div class="flex flex-1 flex-col gap-1 px-2 py-2">
            <h3 class="line-clamp-2 text-sm font-semibold text-white" title="{{ $video->seo_title ?: $video->title }}">
                {{ $video->seo_title ?: $video->title }}
            </h3>
            <div class="flex items-center justify-between text-xs text-slate-400">
                <span>{{ $timeAgo }}</span>
                <div class="flex items-center gap-3">
                    @if ($formattedViews)
                        <span>{{ $formattedViews }} views</span>
                    @endif
                    @if ($formattedLikes !== null)
                        <span class="flex items-center gap-1 text-rose-200">
                            <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 21s-6.7-4.35-9.33-7.5C.6 10.9 1.2 7.8 3.6 6.3c1.9-1.2 4.4-.9 6 1 1.6-1.9 4.1-2.2 6-1 2.4 1.5 3 4.6.93 7.2C18.7 16.65 12 21 12 21z"/>
                            </svg>
                            <span>{{ $formattedLikes }}</span>
                        </span>
                    @endif
                </div>
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
