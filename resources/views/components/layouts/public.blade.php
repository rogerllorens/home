<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? config('app.name', 'Candid Boys') }}</title>
    @stack('head')
    @php
        $assetCdn = config('candidboys.security.asset_cdn');
        $meiliHost = config('scout.meilisearch.host');
        $meiliOrigin = $meiliHost ? (parse_url($meiliHost, PHP_URL_SCHEME) ?? 'https') . '://' . (parse_url($meiliHost, PHP_URL_HOST) ?? '') : null;
    @endphp
    @if ($assetCdn)
        <link rel="preconnect" href="https://{{ $assetCdn }}" crossorigin>
        <link rel="dns-prefetch" href="//{{ $assetCdn }}">
    @endif
    @if ($meiliOrigin)
        <link rel="preconnect" href="{{ $meiliOrigin }}" crossorigin>
        <link rel="dns-prefetch" href="{{ $meiliOrigin }}">
    @endif
    <link rel="preload" href="{{ Vite::asset('resources/css/app.css') }}" as="style">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @php
        $analyticsProvider = config('candidboys.analytics.provider', 'none');
        $plausibleDomain = config('candidboys.analytics.plausible_domain');
        $gaMeasurementId = config('candidboys.analytics.ga_measurement_id');
    @endphp
    @if ($analyticsProvider === 'plausible' && $plausibleDomain)
        <script defer data-domain="{{ $plausibleDomain }}" src="https://plausible.io/js/script.js"></script>
    @elseif ($analyticsProvider === 'ga4' && $gaMeasurementId)
        <script async src="https://www.googletagmanager.com/gtag/js?id={{ $gaMeasurementId }}"></script>
        <script nonce="{{ $cspNonce ?? '' }}">
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', @json($gaMeasurementId), { anonymize_ip: true });
        </script>
    @endif
    <script type="application/ld+json" nonce="{{ $cspNonce ?? '' }}">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => config('app.name', 'Candid Boys'),
            'url' => url('/'),
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
    </script>
    <script type="application/ld+json" nonce="{{ $cspNonce ?? '' }}">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            'name' => config('app.name', 'Candid Boys'),
            'url' => url('/'),
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => route('public.search', ['q' => '{search_term_string}']),
                'query-input' => 'required name=search_term_string',
            ],
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
    </script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 antialiased">
    <div class="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
            <a class="flex items-center gap-2 text-lg font-semibold tracking-wide" href="{{ route('public.home') }}">
                <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200">CB</span>
                <span>{{ config('app.name', __('ui.brand')) }}</span>
            </a>
            <nav class="hidden items-center gap-4 text-sm font-semibold text-slate-200 md:flex" aria-label="{{ __('ui.nav.primary_label') }}">
                <a class="rounded-md px-2 py-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.home') }}">{{ __('ui.nav.home') }}</a>
                <a class="rounded-md px-2 py-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.live') }}">{{ __('ui.nav.live') }}</a>
                <a class="rounded-md px-2 py-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.about') }}">{{ __('ui.nav.about') }}</a>
                <a class="rounded-md px-2 py-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.categories') }}">{{ __('ui.nav.categories') }}</a>
                <a class="rounded-md px-2 py-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.collections.index') }}">{{ __('ui.nav.collections') }}</a>
                <a class="rounded-md px-2 py-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.tags') }}">{{ __('ui.nav.tags') }}</a>
                <a class="rounded-md px-2 py-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.favorites') }}">{{ __('ui.nav.favorites') }}</a>
                <a class="rounded-md px-2 py-1 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.history') }}">{{ __('ui.nav.history') }}</a>
            </nav>
            <form class="ml-auto hidden w-full max-w-md items-center md:flex" method="GET" action="{{ route('public.search') }}" data-track-submit="search.submit" data-track-context="header">
                <label class="sr-only" for="search">{{ __('ui.forms.search_title') }}</label>
                <div class="relative w-full" data-suggestions-wrapper>
                    <div class="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
                        <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            id="search"
                            name="q"
                            type="search"
                            placeholder="{{ __('ui.forms.search_placeholder') }}"
                            class="w-full bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none"
                            autocomplete="off"
                            data-search-autocomplete
                            data-suggestions-url="{{ route('public.search.suggestions') }}"
                        />
                    </div>
                    <div class="absolute inset-x-0 top-full z-30 mt-2 hidden rounded-xl border border-white/10 bg-slate-950/95 p-2 text-sm text-slate-200 shadow-xl" data-suggestions-list></div>
                </div>
            </form>
            <button
                class="ml-auto inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 p-2 text-slate-100 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 md:hidden"
                type="button"
                data-menu-toggle
                aria-expanded="false"
                aria-controls="mobile-menu"
                aria-label="{{ __('ui.nav.open_menu') }}"
            >
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
            </button>
        </div>
        <div id="mobile-menu" class="hidden border-t border-white/10 bg-slate-950/95 px-4 py-4 md:hidden">
            <nav class="flex flex-col gap-3 text-sm font-semibold text-slate-200" aria-label="{{ __('ui.nav.mobile_label') }}">
                <a class="rounded-md px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.home') }}">{{ __('ui.nav.home') }}</a>
                <a class="rounded-md px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.live') }}">{{ __('ui.nav.live') }}</a>
                <a class="rounded-md px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.about') }}">{{ __('ui.nav.about') }}</a>
                <a class="rounded-md px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.categories') }}">{{ __('ui.nav.categories') }}</a>
                <a class="rounded-md px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.collections.index') }}">{{ __('ui.nav.collections') }}</a>
                <a class="rounded-md px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.tags') }}">{{ __('ui.nav.tags') }}</a>
                <a class="rounded-md px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.favorites') }}">{{ __('ui.nav.favorites') }}</a>
                <a class="rounded-md px-2 py-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950" href="{{ route('public.history') }}">{{ __('ui.nav.history') }}</a>
            </nav>
            <form class="mt-4 flex w-full items-center" method="GET" action="{{ route('public.search') }}" data-track-submit="search.submit" data-track-context="mobile_menu">
                <label class="sr-only" for="search-mobile">{{ __('ui.forms.search_title') }}</label>
                <div class="relative w-full" data-suggestions-wrapper>
                    <div class="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
                        <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            id="search-mobile"
                            name="q"
                            type="search"
                            placeholder="{{ __('ui.forms.search_placeholder') }}"
                            class="w-full bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none"
                            autocomplete="off"
                            data-search-autocomplete
                            data-suggestions-url="{{ route('public.search.suggestions') }}"
                        />
                    </div>
                    <div class="absolute inset-x-0 top-full z-30 mt-2 hidden rounded-xl border border-white/10 bg-slate-950/95 p-2 text-sm text-slate-200 shadow-xl" data-suggestions-list></div>
                </div>
            </form>
        </div>
    </div>

    <main class="mx-auto max-w-6xl px-4 py-8">
        {{ $slot }}
    </main>

    <footer class="border-t border-white/10 bg-slate-950/80">
        <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
            <div class="space-y-2">
                <span class="block">{{ __('ui.footer.copyright', ['year' => date('Y')]) }}</span>
                @if (config('candidboys.ui.show_adult_warning'))
                    <span class="block text-xs text-slate-500">{{ config('candidboys.ui.adult_warning_text') }}</span>
                @endif
            </div>
            <div class="flex flex-wrap gap-4">
                <a class="hover:text-slate-200" href="{{ route('public.about') }}">{{ __('ui.footer.about') }}</a>
                <a class="hover:text-slate-200" href="{{ route('public.articles') }}">{{ __('ui.footer.articles') }}</a>
                <a class="hover:text-slate-200" href="{{ route('public.safety') }}">{{ __('ui.footer.safety') }}</a>
                <a class="hover:text-slate-200" href="{{ route('public.terms') }}">{{ __('ui.footer.terms') }}</a>
                <a class="hover:text-slate-200" href="{{ route('public.privacy') }}">{{ __('ui.footer.privacy') }}</a>
                <a class="font-semibold text-red-300 hover:text-red-200" href="{{ route('public.takedown') }}">{{ __('ui.footer.takedown') }}</a>
                <a class="hover:text-slate-200" href="{{ route('public.contact') }}">{{ __('ui.footer.contact') }}</a>
            </div>
        </div>
    </footer>
    <x-cookie-banner />
    <script nonce="{{ $cspNonce ?? '' }}">
        document.addEventListener('DOMContentLoaded', () => {
            const toggle = document.querySelector('[data-menu-toggle]');
            const menu = document.getElementById('mobile-menu');
            if (!toggle || !menu) return;

            toggle.addEventListener('click', () => {
                const isOpen = toggle.getAttribute('aria-expanded') === 'true';
                toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
                menu.classList.toggle('hidden', isOpen);
            });
        });

        const trackEvent = async (eventName, properties = {}) => {
            try {
                await fetch(@json(route('public.events.track')), {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': @json(csrf_token()),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        event: eventName,
                        properties,
                    }),
                });
            } catch (error) {
                // no-op
            }
        };

        const debounce = (fn, delay = 200) => {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => fn(...args), delay);
            };
        };

        const trackCtaImpression = async (payload) => {
            try {
                await fetch(@json(route('public.cta.impression')), {
                    method: 'POST',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': @json(csrf_token()),
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                });
            } catch (error) {
                // no-op
            }
        };

        const buildSuggestions = (container, payload) => {
            if (!payload) return;
            const { tags = [], categories = [], videos = [] } = payload;
            container.innerHTML = '';

            const buildSection = (title, entries, renderItem) => {
                if (!entries.length) return;
                const heading = document.createElement('div');
                heading.className = 'px-2 py-1 text-[11px] uppercase tracking-wide text-slate-400';
                heading.textContent = title;
                container.appendChild(heading);
                entries.forEach(renderItem);
            };

            buildSection('Categories', categories, (category) => {
                const link = document.createElement('a');
                link.className = 'block rounded-md px-2 py-2 hover:bg-white/5';
                link.href = category.url;
                link.textContent = category.label;
                container.appendChild(link);
            });

            buildSection('Tags', tags, (tag) => {
                const link = document.createElement('a');
                link.className = 'block rounded-md px-2 py-2 hover:bg-white/5';
                link.href = tag.url;
                link.textContent = `#${tag.label}`;
                container.appendChild(link);
            });

            buildSection('Videos', videos, (video) => {
                const link = document.createElement('a');
                link.className = 'block rounded-md px-2 py-2 hover:bg-white/5';
                link.href = video.url;
                link.textContent = video.title;
                container.appendChild(link);
            });

            if (!container.children.length) {
                container.classList.add('hidden');
                return;
            }

            container.classList.remove('hidden');
        };

        document.addEventListener('DOMContentLoaded', () => {
            const impressioned = new Set();
            const ctas = Array.from(document.querySelectorAll('[data-cta-id]'));
            if (ctas.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const el = entry.target;
                    const ctaId = el.getAttribute('data-cta-id');
                    if (!ctaId || impressioned.has(ctaId)) return;
                    impressioned.add(ctaId);
                    trackCtaImpression({
                        cta_id: ctaId,
                        origin: el.getAttribute('data-cta-origin'),
                        video: el.getAttribute('data-cta-video'),
                        page_url: window.location.href,
                    });
                });
            }, { rootMargin: '0px 0px -20% 0px' });

            ctas.forEach((cta) => observer.observe(cta));
        });

        const hideSuggestions = (container) => {
            container.classList.add('hidden');
            container.innerHTML = '';
        };

        document.querySelectorAll('[data-search-autocomplete]').forEach((input) => {
            const wrapper = input.closest('[data-suggestions-wrapper]');
            const list = wrapper ? wrapper.querySelector('[data-suggestions-list]') : null;
            const endpoint = input.getAttribute('data-suggestions-url');
            if (!list || !endpoint) return;

            const fetchSuggestions = debounce(async () => {
                const query = input.value.trim();
                if (query.length < 2) {
                    hideSuggestions(list);
                    return;
                }

                try {
                    const url = new URL(endpoint, window.location.origin);
                    url.searchParams.set('q', query);
                    const response = await fetch(url.toString(), {
                        headers: { 'Accept': 'application/json' },
                    });
                    if (!response.ok) {
                        hideSuggestions(list);
                        return;
                    }
                    const payload = await response.json();
                    buildSuggestions(list, payload);
                } catch (error) {
                    hideSuggestions(list);
                }
            }, 200);

            input.addEventListener('input', fetchSuggestions);
            input.addEventListener('blur', () => {
                setTimeout(() => hideSuggestions(list), 150);
            });
        });

        document.addEventListener('submit', (event) => {
            const form = event.target.closest('[data-track-submit]');
            if (!form) return;
            const eventName = form.getAttribute('data-track-submit');
            const context = form.getAttribute('data-track-context');
            const input = form.querySelector('input[type=\"search\"]');
            trackEvent(eventName, {
                query: input?.value || '',
                context,
            });
        });

        document.addEventListener('click', (event) => {
            const target = event.target.closest('[data-track-event]');
            if (!target) return;
            const eventName = target.getAttribute('data-track-event');
            const properties = {
                filter: target.getAttribute('data-track-filter'),
                value: target.getAttribute('data-track-value'),
                context: target.getAttribute('data-track-context'),
            };
            trackEvent(eventName, properties);
        });

        window.trackEvent = trackEvent;
    </script>
</body>
</html>
