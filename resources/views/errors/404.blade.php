<x-layouts.public title="Page not found | Candid Boys">
    @push('head')
        <meta name="description" content="Page not found. Explore the latest videos and categories on Candid Boys.">
    @endpush

    <section class="space-y-6">
        <div class="rounded-md border border-red-600/40 bg-black/70 p-6">
            <p class="text-xs uppercase tracking-wide text-red-300">404 error</p>
            <h1 class="mt-2 text-2xl font-semibold text-white">This page is unavailable.</h1>
            <p class="mt-2 text-sm text-slate-300">Try searching or browse top categories to keep watching.</p>

            <form class="mt-4 flex w-full max-w-md items-center" method="GET" action="{{ route('public.search') }}">
                <label class="sr-only" for="search-404">Search</label>
                <div class="flex w-full items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm">
                    <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                        id="search-404"
                        name="q"
                        type="search"
                        placeholder="Search videos"
                        class="w-full bg-transparent text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    />
                </div>
            </form>

            <div class="mt-4 flex flex-wrap gap-3 text-sm">
                <a class="rounded-md bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-500" href="{{ route('public.home') }}">Back to Home</a>
            </div>
        </div>

        <div>
            <h2 class="text-lg font-semibold text-white">Top categories</h2>
            <div class="mt-3 flex flex-wrap gap-3 text-sm">
                @foreach (['couples', 'first-time', 'romantic', 'playful', 'massage'] as $slug)
                    <a class="rounded-full border border-red-500/50 px-3 py-1 text-red-100 hover:border-red-400" href="{{ route('public.category', $slug) }}">
                        {{ \Illuminate\Support\Str::headline($slug) }}
                    </a>
                @endforeach
            </div>
        </div>
    </section>
</x-layouts.public>
