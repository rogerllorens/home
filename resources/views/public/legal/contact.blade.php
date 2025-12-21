<x-layouts.public title="Contact | Candid Boys">
    @push('head')
        <meta name="description" content="Contact Candid Boys for support or inquiries.">
        <link rel="canonical" href="{{ url('/contact') }}">
    @endpush

    <section class="space-y-6">
        <h1 class="text-2xl font-semibold text-white">Contact</h1>
        <div class="space-y-3 text-sm text-slate-300">
            <p>For support, advertising, or general inquiries, reach out via email.</p>
            <p>Email: <a class="text-red-300 hover:text-red-200" href="mailto:support@candidboys.example">support@candidboys.example</a></p>
            <p>Please allow up to 48 hours for a response.</p>
        </div>
    </section>
</x-layouts.public>
