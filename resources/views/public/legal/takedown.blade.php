<x-layouts.public title="Takedown | Candid Boys">
    @php
        $captchaEnabled = (bool) config('candidboys.security.captcha_enabled')
            && config('candidboys.security.captcha_site_key');
    @endphp
    @push('head')
        <x-seo-head
            title="Takedown | Candid Boys"
            description="DMCA and takedown requests for Candid Boys."
            canonical="{{ url('/takedown') }}"
        />
        @if ($captchaEnabled)
            <script src="https://www.google.com/recaptcha/api.js" async defer></script>
            <script nonce="{{ $cspNonce ?? '' }}">
                const captchaCallback = (token) => {
                    const input = document.getElementById('captcha');
                    if (input) {
                        input.value = token;
                    }
                };
            </script>
        @endif
    @endpush

    <section class="space-y-6">
        <h1 class="text-2xl font-semibold text-white">Takedown Requests</h1>
        <div class="space-y-3 text-sm text-slate-300">
            <p>If you believe content infringes your rights, submit a DMCA notice with the URL, proof of ownership, and contact details.</p>
            <p>We respond quickly and remove or restrict content when valid requests are verified.</p>
            <p>Email: <a class="text-red-300 hover:text-red-200" href="mailto:legal@candidboys.example">legal@candidboys.example</a></p>
        </div>
    </section>

    @if (session('status'))
        <div class="mt-6 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {{ session('status') }}
        </div>
    @endif

    <form class="mt-6 max-w-2xl space-y-4 rounded-xl border border-white/10 bg-white/5 p-6" method="POST" action="{{ route('public.takedown') }}">
        @csrf
        <div>
            <label class="text-sm text-slate-300" for="url">Content URL</label>
            <input id="url" name="url" type="url" value="{{ old('url') }}" required class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            @error('url')
                <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
            @enderror
        </div>
        <div>
            <label class="text-sm text-slate-300" for="email">Email</label>
            <input id="email" name="email" type="email" value="{{ old('email') }}" required class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            @error('email')
                <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
            @enderror
        </div>
        <div>
            <label class="text-sm text-slate-300" for="requester_name">Name</label>
            <input id="requester_name" name="requester_name" type="text" value="{{ old('requester_name') }}" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </div>
        <div>
            <label class="text-sm text-slate-300" for="reason">Reason</label>
            <textarea id="reason" name="reason" rows="4" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">{{ old('reason') }}</textarea>
        </div>
        <div>
            <label class="text-sm text-slate-300" for="notes">Additional details</label>
            <textarea id="notes" name="notes" rows="4" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">{{ old('notes') }}</textarea>
        </div>
        <div class="hidden">
            <label for="website">Website</label>
            <input id="website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>
        @if ($captchaEnabled)
            <div>
                <label class="text-sm text-slate-300">Captcha</label>
                <div class="mt-2">
                    <div class="g-recaptcha" data-sitekey="{{ config('candidboys.security.captcha_site_key') }}" data-callback="captchaCallback"></div>
                </div>
                <input id="captcha" name="captcha" type="hidden" value="{{ old('captcha') }}" />
                @error('captcha')
                    <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
                @enderror
            </div>
        @endif
        <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400" type="submit">Submit request</button>
    </form>
</x-layouts.public>
