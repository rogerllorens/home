<x-layouts.public title="Contact | Candid Boys">
    @push('head')
        <x-seo-head
            title="Contact | Candid Boys"
            description="Contact Candid Boys for support or inquiries."
            canonical="{{ url('/contact') }}"
        />
    @endpush

    <section class="space-y-6">
        <h1 class="text-2xl font-semibold text-white">Contact</h1>
        <div class="space-y-3 text-sm text-slate-300">
            <p>For support, advertising, or general inquiries, reach out via email.</p>
            <p>Email: <a class="text-red-300 hover:text-red-200" href="mailto:support@candidboys.example">support@candidboys.example</a></p>
            <p>Please allow up to 48 hours for a response.</p>
        </div>
    </section>

    @if (session('status'))
        <div class="mt-6 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {{ session('status') }}
        </div>
    @endif

    <form class="mt-6 max-w-2xl space-y-4 rounded-xl border border-white/10 bg-white/5 p-6" method="POST" action="{{ route('public.contact') }}">
        @csrf
        <div>
            <label class="text-sm text-slate-300" for="name">Name</label>
            <input id="name" name="name" type="text" value="{{ old('name') }}" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </div>
        <div>
            <label class="text-sm text-slate-300" for="email">Email</label>
            <input id="email" name="email" type="email" value="{{ old('email') }}" required class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            @error('email')
                <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
            @enderror
        </div>
        <div>
            <label class="text-sm text-slate-300" for="subject">Subject</label>
            <input id="subject" name="subject" type="text" value="{{ old('subject') }}" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </div>
        <div>
            <label class="text-sm text-slate-300" for="message">Message</label>
            <textarea id="message" name="message" rows="6" required class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">{{ old('message') }}</textarea>
            @error('message')
                <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
            @enderror
        </div>
        <div class="hidden">
            <label for="website">Website</label>
            <input id="website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>
        @if (config('candidboys.security.captcha_enabled'))
            <div>
                <label class="text-sm text-slate-300" for="captcha">Captcha</label>
                <input id="captcha" name="captcha" type="text" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
                @error('captcha')
                    <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
                @enderror
            </div>
        @endif
        <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400" type="submit">Send message</button>
    </form>
</x-layouts.public>
