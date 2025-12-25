<x-layouts.public title="Privacy | Candid Boys">
    @push('head')
        <x-seo-head
            title="Privacy | Candid Boys"
            description="Privacy overview and data handling for Candid Boys."
            canonical="{{ url('/privacy') }}"
        />
    @endpush

    <section class="space-y-6">
        <h1 class="text-2xl font-semibold text-white">Privacy Policy</h1>
        <div class="space-y-3 text-sm text-slate-300">
            <!-- TODO: Adjust this text to match the legal obligations in your jurisdiction. -->
            <p>We collect minimal data to improve performance and content quality. We do not sell personal information.</p>
            <p>Search queries and viewing behavior may be aggregated for analytics and ranking.</p>
            <p>If you want to exercise data rights or ask questions, contact us through the listed channels.</p>
        </div>
    </section>
</x-layouts.public>
