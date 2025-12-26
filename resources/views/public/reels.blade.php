@php
    $pageTitle = 'Reels | Candid Boys';
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="Reels móviles con vídeos virales y navegación rápida."
            canonical="{{ route('public.reels') }}"
        />
    @endpush

    <section class="space-y-6" id="reels-feed" data-next-page="{{ $nextPage }}">
        <div class="rounded-xl border border-white/10 bg-white/5 p-4 md:p-6">
            <h1 class="text-3xl font-semibold text-white">Reels</h1>
            <p class="mt-2 text-sm text-slate-300">{{ __('ui.reels.intro') }}</p>
        </div>

        <div class="space-y-8">
            @foreach ($videos as $video)
                @php
                    $tags = array_slice($video->raw_tags ?? [], 0, 6);
                    $thumbnail = $video->thumbnail_url ?: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';
                    $iframeSandbox = $video->source?->settings['iframe_sandbox'] ?? 'allow-scripts allow-same-origin allow-presentation';
                    $iframeAllow = $video->source?->settings['iframe_allow'] ?? 'fullscreen; picture-in-picture';
                @endphp
                <article class="reel-card relative min-h-screen rounded-2xl border border-white/10 bg-black/80 p-4 md:p-6" data-reel-card data-video-id="{{ $video->id }}" data-embed-url="{{ $video->embed_url }}" data-iframe-sandbox="{{ $iframeSandbox }}" data-iframe-allow="{{ $iframeAllow }}">
                    <header class="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 class="text-xl font-semibold text-white">{{ $video->seo_title ?: $video->title }}</h2>
                            <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                @foreach ($tags as $tag)
                                    <span class="rounded-full bg-white/5 px-2 py-1 text-slate-200">#{{ $tag }}</span>
                                @endforeach
                            </div>
                        </div>
                            <a class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-white/30" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]) }}">
                                {{ __('ui.buttons.view_details') }}
                            </a>
                    </header>

                    <div class="mt-4 flex flex-col gap-4 lg:flex-row">
                        <div class="relative w-full overflow-hidden rounded-xl bg-black lg:flex-1">
                            <div class="aspect-video w-full">
                                <img src="{{ $thumbnail }}" alt="{{ $video->title }}" class="h-full w-full object-cover" loading="lazy" decoding="async" data-reel-thumb>
                            </div>
                            <button class="absolute inset-0 flex items-center justify-center bg-black/50 text-white" type="button" data-reel-play>
                                <span class="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold">Ver</span>
                            </button>
                            <div class="hidden absolute inset-0 h-full w-full bg-black" data-reel-embed></div>
                        </div>

                        <div class="flex items-start justify-between gap-4 text-sm text-slate-200 lg:w-40 lg:flex-col">
                            <button
                                type="button"
                        class="inline-flex items-center gap-2 rounded-full border border-rose-500/60 px-3 py-1 text-xs font-semibold text-rose-100 hover:border-rose-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 {{ $video->liked_by_device ? 'bg-rose-500/20' : '' }}"
                                data-like-button
                                data-video-id="{{ $video->id }}"
                                data-liked="{{ $video->liked_by_device ? 'true' : 'false' }}"
                                aria-pressed="{{ $video->liked_by_device ? 'true' : 'false' }}"
                                aria-label="Like video"
                            >
                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <path d="M12 21s-6.7-4.35-9.33-7.5C.6 10.9 1.2 7.8 3.6 6.3c1.9-1.2 4.4-.9 6 1 1.6-1.9 4.1-2.2 6-1 2.4 1.5 3 4.6.93 7.2C18.7 16.65 12 21 12 21z"/>
                                </svg>
                                <span data-like-count>{{ $video->display_likes ?? 0 }}</span>
                            </button>
                            <button class="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-white/30" type="button">
                                Comments
                            </button>
                            <a class="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10" href="{{ route('public.video', ['slug' => \Illuminate\Support\Str::slug($video->seo_title ?: $video->title), 'id' => $video->id]) }}">
                                Open video
                            </a>
                        </div>
                    </div>
                </article>
            @endforeach
        </div>
    </section>
</x-layouts.public>

@push('head')
    <script nonce="{{ $cspNonce ?? '' }}">
        document.addEventListener('DOMContentLoaded', () => {
            const cards = document.querySelectorAll('[data-reel-card]');
            const feed = document.getElementById('reels-feed');

            const loadEmbed = (card) => {
                const embedContainer = card.querySelector('[data-reel-embed]');
                if (!embedContainer || embedContainer.getAttribute('data-loaded') === 'true') {
                    return;
                }
                const url = card.getAttribute('data-embed-url');
                if (!url) return;

                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.className = 'h-full w-full';
                iframe.allow = card.getAttribute('data-iframe-allow') || 'fullscreen; picture-in-picture';
                iframe.sandbox = card.getAttribute('data-iframe-sandbox') || 'allow-scripts allow-same-origin allow-presentation';

                embedContainer.innerHTML = '';
                embedContainer.appendChild(iframe);
                embedContainer.classList.remove('hidden');
                embedContainer.setAttribute('data-loaded', 'true');
                const thumb = card.querySelector('[data-reel-thumb]');
                if (thumb) {
                    thumb.classList.add('opacity-0');
                }

                const overlay = card.querySelector('[data-reel-play]');
                if (overlay) {
                    overlay.remove();
                }
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const card = entry.target;
                    if (entry.isIntersecting) {
                        card.classList.add('ring-2', 'ring-red-500/50');
                        loadEmbed(card);
                    } else {
                        card.classList.remove('ring-2', 'ring-red-500/50');
                    }
                });
            }, { threshold: 0.6 });

            cards.forEach((card) => observer.observe(card));

            document.addEventListener('click', (event) => {
                const playButton = event.target.closest('[data-reel-play]');
                if (playButton) {
                    const card = playButton.closest('[data-reel-card]');
                    if (card) {
                        loadEmbed(card);
                    }
                }

                const likeButton = event.target.closest('[data-like-button]');
                if (likeButton) {
                    const videoId = likeButton.getAttribute('data-video-id');
                    if (!videoId) return;
                    fetch(`/videos/${videoId}/like`, {
                        method: 'POST',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN': @json(csrf_token()),
                            'Accept': 'application/json',
                        },
                    }).then((response) => response.ok ? response.json() : null)
                      .then((payload) => {
                          if (!payload) return;
                          const count = likeButton.querySelector('[data-like-count]');
                          if (count) {
                              count.textContent = payload.likes_count;
                          }
                          likeButton.setAttribute('aria-pressed', payload.liked ? 'true' : 'false');
                          likeButton.classList.toggle('bg-rose-500/20', payload.liked);
                      });
                }
            });

            const labels = {
                viewDetails: @json(__('ui.buttons.view_details')),
                openVideo: @json(__('ui.reels.open_video', [], app()->getLocale()) ?? 'Open video'),
                comments: @json(__('ui.reels.comments', [], app()->getLocale()) ?? 'Comments'),
                play: @json(__('ui.reels.play', [], app()->getLocale()) ?? 'Ver'),
            };

            const loadMore = async () => {
                const nextPage = feed.getAttribute('data-next-page');
                if (!nextPage) return;
                feed.setAttribute('data-next-page', '');

                const response = await fetch(`{{ route('public.reels.feed') }}?page=${nextPage}`);
                if (!response.ok) return;
                const payload = await response.json();
                const list = feed.querySelector('.space-y-8');
                payload.data.forEach((item) => {
                    const card = document.createElement('article');
                    card.className = 'reel-card relative min-h-screen rounded-2xl border border-white/10 bg-black/80 p-4 md:p-6';
                    card.setAttribute('data-reel-card', '');
                    card.setAttribute('data-video-id', item.id);
                    card.setAttribute('data-embed-url', item.embed_url || '');
                    card.setAttribute('data-iframe-allow', 'fullscreen; picture-in-picture');
                    card.setAttribute('data-iframe-sandbox', 'allow-scripts allow-same-origin allow-presentation');

                    card.innerHTML = `
                        <header class="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 class="text-xl font-semibold text-white">${item.title}</h2>
                                <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                    ${(item.tags || []).map(tag => `<span class="rounded-full bg-white/5 px-2 py-1 text-slate-200">#${tag}</span>`).join('')}
                                </div>
                            </div>
                            <a class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-white/30" href="/v/${item.slug}-${item.id}">
                                ${labels.viewDetails}
                            </a>
                        </header>
                        <div class="mt-4 flex flex-col gap-4 lg:flex-row">
                            <div class="relative w-full overflow-hidden rounded-xl bg-black lg:flex-1">
                                <div class="aspect-video w-full">
                                    <img src="${item.thumbnail || ''}" alt="${item.title}" class="h-full w-full object-cover" loading="lazy" decoding="async" data-reel-thumb>
                                </div>
                                <button class="absolute inset-0 flex items-center justify-center bg-black/50 text-white" type="button" data-reel-play>
                                    <span class="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold">${labels.play}</span>
                                </button>
                                <div class="hidden absolute inset-0 h-full w-full bg-black" data-reel-embed></div>
                            </div>
                            <div class="flex items-start justify-between gap-4 text-sm text-slate-200 lg:w-40 lg:flex-col">
                                <button type="button" class="inline-flex items-center gap-2 rounded-full border border-rose-500/60 px-3 py-1 text-xs font-semibold text-rose-100 hover:border-rose-400 ${item.liked ? 'bg-rose-500/20' : ''}" data-like-button data-video-id="${item.id}" data-liked="${item.liked}" aria-pressed="${item.liked}" aria-label="Like video">
                                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                        <path d="M12 21s-6.7-4.35-9.33-7.5C.6 10.9 1.2 7.8 3.6 6.3c1.9-1.2 4.4-.9 6 1 1.6-1.9 4.1-2.2 6-1 2.4 1.5 3 4.6.93 7.2C18.7 16.65 12 21 12 21z"/>
                                    </svg>
                                    <span data-like-count>${item.likes}</span>
                                </button>
                                <button class="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold text-slate-200 hover:border-white/30" type="button">
                                    ${labels.comments}
                                </button>
                                <a class="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10" href="/v/${item.slug}-${item.id}">
                                    ${labels.openVideo}
                                </a>
                            </div>
                        </div>
                    `;

                    list.appendChild(card);
                    observer.observe(card);
                });

                feed.setAttribute('data-next-page', payload.next_page || '');
            };

            const sentinel = document.createElement('div');
            sentinel.className = 'h-10';
            feed.appendChild(sentinel);

            const infiniteObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        loadMore();
                    }
                });
            }, { rootMargin: '300px' });

            infiniteObserver.observe(sentinel);
        });
    </script>
@endpush
