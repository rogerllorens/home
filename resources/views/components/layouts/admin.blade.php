<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Admin | Candid Boys' }}</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 antialiased">
    <div class="flex min-h-screen">
        <aside class="w-64 border-r border-white/10 bg-slate-950/80 px-4 py-6">
            <div class="mb-8 flex items-center gap-2 text-lg font-semibold">
                <span class="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-200">CB</span>
                <span>Admin</span>
            </div>
            <nav class="space-y-2 text-sm">
                <a class="block rounded-lg px-3 py-2 hover:bg-white/10" href="{{ route('admin.dashboard') }}">Dashboard</a>
                <a class="block rounded-lg px-3 py-2 hover:bg-white/10" href="{{ route('admin.sources.index') }}">Sources</a>
                <a class="block rounded-lg px-3 py-2 hover:bg-white/10" href="{{ route('admin.import-runs.index') }}">Import runs</a>
                <a class="block rounded-lg px-3 py-2 hover:bg-white/10" href="{{ route('admin.videos.index') }}">Videos</a>
                <a class="block rounded-lg px-3 py-2 hover:bg-white/10" href="{{ route('admin.takedowns.index') }}">Takedowns</a>
            </nav>
        </aside>

        <div class="flex-1">
            <header class="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-4">
                <div>
                    <h1 class="text-lg font-semibold">{{ $heading ?? 'Panel' }}</h1>
                    @isset($subheading)
                        <p class="text-sm text-slate-400">{{ $subheading }}</p>
                    @endisset
                </div>
                <form method="POST" action="{{ route('admin.logout') }}">
                    @csrf
                    <button class="rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-indigo-400/60" type="submit">
                        Cerrar sesión
                    </button>
                </form>
            </header>

            <main class="space-y-6 px-6 py-8">
                @if (session('status'))
                    <div class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                        {{ session('status') }}
                    </div>
                @endif

                {{ $slot }}
            </main>
        </div>
    </div>
</body>
</html>
