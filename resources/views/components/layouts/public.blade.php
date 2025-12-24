<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? config('app.name', 'Candid Boys') }}</title>
    @stack('head')
    <link rel="preload" href="{{ Vite::asset('resources/css/app.css') }}" as="style">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <script type="application/ld+json" nonce="{{ $cspNonce ?? '' }}">
        {!! json_encode([
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            'name' => config('app.name', 'Candid Boys'),
            'url' => url('/'),
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
    </script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 antialiased">
    <div class="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
        <div class="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
            <div class="flex items-center gap-2 text-lg font-semibold tracking-wide">
                <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200">CB</span>
                <span>Candid Boys</span>
            </div>
            <form class="ml-auto flex w-full max-w-md items-center" method="GET" action="{{ route('public.search') }}">
                <label class="sr-only" for="search">Buscar</label>
                <div class="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
                    <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        id="search"
                        name="q"
                        type="search"
                        placeholder="Buscar videos o tags"
                        class="w-full bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                </div>
            </form>
        </div>
    </div>

    <main class="mx-auto max-w-6xl px-4 py-8">
        {{ $slot }}
    </main>

    <footer class="border-t border-white/10 bg-slate-950/80">
        <div class="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
            <span>© {{ date('Y') }} Candid Boys</span>
            <div class="flex flex-wrap gap-4">
                <a class="hover:text-slate-200" href="{{ route('public.terms') }}">Terms</a>
                <a class="hover:text-slate-200" href="{{ route('public.privacy') }}">Privacy</a>
                <a class="hover:text-slate-200" href="{{ route('public.takedown') }}">Takedown</a>
                <a class="hover:text-slate-200" href="{{ route('public.contact') }}">Contact</a>
            </div>
        </div>
    </footer>
</body>
</html>
