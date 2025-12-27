@php
    $titleMax = (int) config('candidboys.seo.title_max', 70);
    $descMax = (int) config('candidboys.seo.desc_max', 160);
    $pageTitle = $pageTitle ?? \Illuminate\Support\Str::limit('Candid Boys | Mapa de contenido', $titleMax, '');
    $pageDescription = $pageDescription ?? \Illuminate\Support\Str::limit('Explora categorías y tags con un mapa visual para descubrir contenido nuevo en segundos.', $descMax, '');
    $mapEndpoint = url('/api/content-map');
    $locale = app()->getLocale();
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ $pageDescription }}"
            canonical="{{ route('public.map') }}"
        />
    @endpush

    <section class="mb-8 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-slate-950 to-slate-950 p-6 md:p-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div class="space-y-3">
                <p class="text-xs uppercase tracking-[0.3em] text-indigo-300">Discover</p>
                <h1 class="text-3xl font-semibold text-white md:text-4xl">Mapa visual de categorías y tags</h1>
                <p class="max-w-2xl text-sm text-slate-300 md:text-base">
                    Navega el catálogo como un universo de burbujas. Cada tamaño representa el volumen de videos, y cada clic te lleva a descubrir más.
                </p>
            </div>
            <div class="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 md:text-sm">
                <p class="font-semibold text-slate-100">Cómo usarlo</p>
                <p>Explora las burbujas y toca una categoría o tag para abrir su página.</p>
            </div>
        </div>
    </section>

    <section class="space-y-6">
        <div class="hidden md:grid md:grid-cols-2 md:gap-6" data-map-root data-endpoint="{{ $mapEndpoint }}" data-locale="{{ $locale }}">
            <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-white">Categorías principales</h2>
                    <span class="text-xs uppercase tracking-wide text-slate-400">Tamaño ∝ videos</span>
                </div>
                <div class="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_55%)]"></div>
                    <div id="category-bubbles" class="relative z-10 flex flex-wrap items-center justify-center gap-4"></div>
                </div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div class="mb-4 flex items-center justify-between">
                    <h2 class="text-lg font-semibold text-white">Tags más usados</h2>
                    <span class="text-xs uppercase tracking-wide text-slate-400">Populares ahora</span>
                </div>
                <div class="relative min-h-[420px] overflow-hidden rounded-2xl border border-white/5 bg-slate-950/60 p-4">
                    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(248,113,113,0.15),_transparent_55%)]"></div>
                    <div id="tag-bubbles" class="relative z-10 flex flex-wrap items-center justify-center gap-3"></div>
                </div>
            </div>
        </div>

        <div class="space-y-6 md:hidden" data-map-mobile data-endpoint="{{ $mapEndpoint }}" data-locale="{{ $locale }}">
            <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 class="text-lg font-semibold text-white">Categorías</h2>
                <div id="category-list" class="mt-4 space-y-3"></div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 class="text-lg font-semibold text-white">Tags</h2>
                <div id="tag-list" class="mt-4 flex flex-wrap gap-2"></div>
            </div>
        </div>
    </section>

    <script nonce="{{ $cspNonce ?? '' }}">
        document.addEventListener('DOMContentLoaded', () => {
            const mapRoot = document.querySelector('[data-map-root]');
            const mobileRoot = document.querySelector('[data-map-mobile]');
            const target = mapRoot || mobileRoot;
            if (!target) return;

            const endpoint = target.dataset.endpoint;
            const locale = target.dataset.locale;

            const categoryContainer = document.getElementById('category-bubbles');
            const tagContainer = document.getElementById('tag-bubbles');
            const categoryList = document.getElementById('category-list');
            const tagList = document.getElementById('tag-list');

            const categoryPalette = [
                'bg-indigo-500/20 text-indigo-100 border-indigo-400/30',
                'bg-emerald-500/20 text-emerald-100 border-emerald-400/30',
                'bg-sky-500/20 text-sky-100 border-sky-400/30',
                'bg-purple-500/20 text-purple-100 border-purple-400/30',
                'bg-amber-500/20 text-amber-100 border-amber-400/30',
            ];

            const tagPalette = [
                'bg-rose-500/20 text-rose-100 border-rose-400/30',
                'bg-cyan-500/20 text-cyan-100 border-cyan-400/30',
                'bg-lime-500/20 text-lime-100 border-lime-400/30',
                'bg-fuchsia-500/20 text-fuchsia-100 border-fuchsia-400/30',
            ];

            const buildBubble = (item, maxValue, palette, minSize, maxSize, type) => {
                const size = Math.round(minSize + ((item.total / maxValue) * (maxSize - minSize || 1)));
                const bubble = document.createElement('a');
                const colorClass = palette[Math.abs(item.total) % palette.length];
                const destination = type === 'category'
                    ? `/${locale}/c/${item.slug}`
                    : `/${locale}/t/${encodeURIComponent(item.tag)}`;

                bubble.href = destination;
                bubble.className = `group flex flex-col items-center justify-center gap-1 rounded-full border text-center text-xs font-semibold shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${colorClass}`;
                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.setAttribute('title', `${type === 'category' ? item.label : '#' + item.tag} • ${item.total} videos`);
                bubble.innerHTML = `
                    <span class="px-2 text-xs font-semibold text-white/90">${type === 'category' ? item.label : '#' + item.tag}</span>
                    <span class="text-[10px] text-white/60">${item.total}</span>
                `;

                return bubble;
            };

            const buildCategoryCard = (item) => {
                const card = document.createElement('a');
                card.href = `/${locale}/c/${item.slug}`;
                card.className = 'flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm font-semibold text-slate-100';
                card.innerHTML = `
                    <span>${item.label}</span>
                    <span class="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-300">${item.total} videos</span>
                `;
                return card;
            };

            const buildTagPill = (item) => {
                const pill = document.createElement('a');
                pill.href = `/${locale}/t/${encodeURIComponent(item.tag)}`;
                pill.className = 'rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200';
                pill.textContent = `#${item.tag} · ${item.total}`;
                return pill;
            };

            fetch(endpoint)
                .then((response) => response.json())
                .then((data) => {
                    const categories = data.categories || [];
                    const tags = data.tags || [];

                    if (categoryContainer) {
                        categoryContainer.innerHTML = '';
                        if (!categories.length) {
                            categoryContainer.innerHTML = '<p class="text-sm text-slate-400">Sin categorías para mostrar todavía.</p>';
                        } else {
                            const maxCategory = Math.max(...categories.map((item) => item.total));
                            categories.forEach((item, index) => {
                                const bubble = buildBubble(item, maxCategory, categoryPalette, 90, 190, 'category');
                                bubble.dataset.index = index;
                                categoryContainer.appendChild(bubble);
                            });
                        }
                    }

                    if (tagContainer) {
                        tagContainer.innerHTML = '';
                        if (!tags.length) {
                            tagContainer.innerHTML = '<p class="text-sm text-slate-400">Sin tags todavía.</p>';
                        } else {
                            const maxTag = Math.max(...tags.map((item) => item.total));
                            tags.forEach((item, index) => {
                                const bubble = buildBubble(item, maxTag, tagPalette, 70, 140, 'tag');
                                bubble.dataset.index = index;
                                tagContainer.appendChild(bubble);
                            });
                        }
                    }

                    if (categoryList) {
                        categoryList.innerHTML = '';
                        categories.slice(0, 30).forEach((item) => categoryList.appendChild(buildCategoryCard(item)));
                    }

                    if (tagList) {
                        tagList.innerHTML = '';
                        tags.slice(0, 30).forEach((item) => tagList.appendChild(buildTagPill(item)));
                    }
                })
                .catch(() => {
                    if (categoryContainer) {
                        categoryContainer.innerHTML = '<p class="text-sm text-slate-400">No se pudo cargar el mapa.</p>';
                    }
                    if (tagContainer) {
                        tagContainer.innerHTML = '<p class="text-sm text-slate-400">No se pudo cargar el mapa.</p>';
                    }
                    if (categoryList) {
                        categoryList.innerHTML = '<p class="text-sm text-slate-400">No se pudo cargar el mapa.</p>';
                    }
                    if (tagList) {
                        tagList.innerHTML = '<p class="text-sm text-slate-400">No se pudo cargar el mapa.</p>';
                    }
                });
        });
    </script>
</x-layouts.public>
