<x-layouts.public title="Too many requests | Candid Boys">
    @push('head')
        <x-seo-head
            title="Too many requests | Candid Boys"
            description="You are making requests too quickly. Please wait and try again."
            canonical="{{ url()->current() }}"
            robots="noindex,follow"
        />
    @endpush

    <section class="space-y-6">
        <div class="rounded-md border border-red-600/40 bg-black/70 p-6">
            <p class="text-xs uppercase tracking-wide text-red-300">429 error</p>
            <h1 class="mt-2 text-2xl font-semibold text-white">Slow down for a moment.</h1>
            <p class="mt-2 text-sm text-slate-300">Please wait a bit before trying again.</p>
            <div class="mt-4 flex flex-wrap gap-3 text-sm">
                <a class="rounded-md bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-500" href="{{ route('public.home') }}">Back to Home</a>
                <a class="rounded-md border border-white/10 px-3 py-2 font-semibold text-slate-100 hover:border-white/30" href="{{ route('public.contact') }}">Contact support</a>
            </div>
        </div>
    </section>
</x-layouts.public>
