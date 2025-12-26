<x-layouts.public title="Contact | Candid Boys">
    @php
        $captchaEnabled = (bool) config('candidboys.security.captcha_enabled')
            && config('candidboys.security.captcha_site_key');
    @endphp
    @push('head')
        <x-seo-head
            title="Contact | Candid Boys"
            description="Contact Candid Boys for support or inquiries."
            canonical="{{ url('/contact') }}"
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
        <h1 class="text-2xl font-semibold text-white">Contact</h1>
        <div class="space-y-4 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">Placeholder notice</p>
            <p>Este contenido es un ejemplo estructural y debe ser reemplazado por un abogado o asesor legal. No constituye asesoría legal.</p>
            <p>Para soporte o consultas generales, escríbenos a los canales oficiales.</p>
            <p>Email: <a class="text-red-300 hover:text-red-200" href="mailto:support@candidboys.example">support@candidboys.example</a></p>
            <p>Tiempo de respuesta estimado: 24-48 horas.</p>
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
        <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400" type="submit">Send message</button>
    </form>
</x-layouts.public>
