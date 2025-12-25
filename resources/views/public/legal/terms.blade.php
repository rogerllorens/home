<x-layouts.public title="Terms | Candid Boys">
    @push('head')
        <x-seo-head
            title="Terms | Candid Boys"
            description="Terms of use, 18+ notice, and general guidelines for Candid Boys."
            canonical="{{ url('/terms') }}"
        />
    @endpush

    <section class="space-y-6">
        <h1 class="text-2xl font-semibold text-white">Terms of Service</h1>
        <div class="space-y-3 text-sm text-slate-300">
            <!-- TODO: Review this text with legal counsel to comply with local regulations. -->
            <p>You must be 18+ to access this site. By browsing you confirm you meet the minimum age and local requirements.</p>
            <p>Content is provided for personal viewing only. Do not redistribute or rehost media without permission.</p>
            <p>We may remove or restrict content to comply with legal or safety requirements.</p>
        </div>
    </section>
</x-layouts.public>
