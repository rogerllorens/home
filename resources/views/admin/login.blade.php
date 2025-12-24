<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Login | Candid Boys</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 antialiased">
    <div class="flex min-h-screen items-center justify-center px-4">
        <div class="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <div class="mb-6 text-center">
                <div class="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-200">CB</div>
                <h1 class="text-xl font-semibold">Acceso admin</h1>
                <p class="mt-2 text-sm text-slate-400">Usa el admin creado con <code>php artisan admin:sync</code>.</p>
            </div>

            <form class="space-y-4" method="POST" action="{{ route('admin.login') }}">
                @csrf
                <div>
                    <label class="text-sm text-slate-300" for="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value="{{ old('email') }}"
                        class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                    @error('email')
                        <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
                    @enderror
                </div>
                <div>
                    <label class="text-sm text-slate-300" for="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                    />
                </div>
                <button class="w-full rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400" type="submit">
                    Entrar
                </button>
            </form>
        </div>
    </div>
</body>
</html>
