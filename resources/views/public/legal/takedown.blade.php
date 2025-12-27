@php
    $brand = config('app.name', __('ui.brand'));
    $pageTitle = __('ui.meta.takedown_title', ['brand' => $brand]);
@endphp

<x-layouts.public title="{{ $pageTitle }}">
    @php
        $captchaEnabled = (bool) config('candidboys.security.captcha_enabled')
            && config('candidboys.security.captcha_site_key');
    @endphp
    @push('head')
        <x-seo-head
            title="{{ $pageTitle }}"
            description="{{ __('ui.meta.takedown_description', ['brand' => $brand]) }}"
            canonical="{{ route('public.takedown') }}"
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
        <h1 class="text-2xl font-semibold text-white">{{ __('ui.legal.takedown.title') }}</h1>
        <div class="space-y-5 text-sm text-slate-300">
            <p class="text-xs uppercase tracking-wide text-slate-500">{{ __('ui.legal.placeholder_notice') }}</p>
            <p>{{ __('ui.legal.placeholder_copy') }}</p>

            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.takedown.report') }}</h2>
                <p class="mt-2">{{ __('ui.legal.takedown.report_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.takedown.info') }}</h2>
                <p class="mt-2">{{ __('ui.legal.takedown.info_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.takedown.response') }}</h2>
                <p class="mt-2">{{ __('ui.legal.takedown.response_body') }}</p>
            </div>
            <div>
                <h2 class="text-base font-semibold text-white">{{ __('ui.legal.takedown.contact') }}</h2>
                <p class="mt-2">{!! __('ui.legal.takedown.contact_body', ['email' => '<a class=\"text-red-300 hover:text-red-200\" href=\"mailto:legal@candidboys.example\">legal@candidboys.example</a>']) !!}</p>
            </div>
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
            <label class="text-sm text-slate-300" for="url">{{ __('ui.forms.content_url') }}</label>
            <input id="url" name="url" type="url" value="{{ old('url') }}" required placeholder="https://example.com/video" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            @error('url')
                <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
            @enderror
        </div>
        <div>
            <label class="text-sm text-slate-300" for="email">{{ __('ui.forms.email') }}</label>
            <input id="email" name="email" type="email" value="{{ old('email') }}" required class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
            @error('email')
                <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
            @enderror
        </div>
        <div>
            <label class="text-sm text-slate-300" for="requester_name">{{ __('ui.forms.requester_name') }}</label>
            <input id="requester_name" name="requester_name" type="text" value="{{ old('requester_name') }}" required class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100" />
        </div>
        <div>
            <label class="text-sm text-slate-300" for="reason">{{ __('ui.forms.reason') }}</label>
            <textarea id="reason" name="reason" rows="4" required class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">{{ old('reason') }}</textarea>
        </div>
        <div>
            <label class="text-sm text-slate-300" for="notes">{{ __('ui.forms.notes') }}</label>
            <textarea id="notes" name="notes" rows="4" class="mt-2 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100">{{ old('notes') }}</textarea>
        </div>
        <div class="hidden">
            <label for="website">{{ __('ui.forms.website') }}</label>
            <input id="website" name="website" type="text" tabindex="-1" autocomplete="off">
        </div>
        @if ($captchaEnabled)
            <div>
                <label class="text-sm text-slate-300">{{ __('ui.forms.captcha') }}</label>
                <div class="mt-2">
                    <div class="g-recaptcha" data-sitekey="{{ config('candidboys.security.captcha_site_key') }}" data-callback="captchaCallback"></div>
                </div>
                <input id="captcha" name="captcha" type="hidden" value="{{ old('captcha') }}" />
                @error('captcha')
                    <p class="mt-1 text-xs text-rose-300">{{ $message }}</p>
                @enderror
            </div>
        @endif
        <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400" type="submit">{{ __('ui.forms.submit_request') }}</button>
    </form>
</x-layouts.public>
