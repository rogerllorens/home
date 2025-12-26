@php
    $bannerEnabled = (bool) config('candidboys.ui.cookie_banner_enabled');
    $cookieName = (string) config('candidboys.ui.cookie_banner_cookie', 'cookie_consent');
    $hasConsent = request()->cookie($cookieName);
@endphp

@if ($bannerEnabled && !$hasConsent)
    <div class="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 px-4 py-4 text-sm text-slate-200 backdrop-blur">
        <div class="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p>
                {{ config('candidboys.ui.cookie_notice_text', 'Usamos cookies y analítica básica para mejorar la experiencia. Puedes aceptar para continuar.') }}
                <span class="block text-xs text-slate-400">
                    {{ config('candidboys.ui.cookie_ads_notice_text', 'Este sitio puede incluir contenido patrocinado o anuncios.') }}
                </span>
            </p>
            <button
                class="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                type="button"
                data-cookie-accept
                aria-label="Accept cookies"
            >
                Aceptar
            </button>
        </div>
        <script nonce="{{ $cspNonce ?? '' }}">
            document.addEventListener('DOMContentLoaded', () => {
                const button = document.querySelector('[data-cookie-accept]');
                if (!button) return;

                button.addEventListener('click', () => {
                    const maxAge = 60 * 60 * 24 * 365;
                    document.cookie = `${@json($cookieName)}=1; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
                    const banner = button.closest('div[class*="fixed"]');
                    if (banner) {
                        banner.remove();
                    }
                }, { once: true });
            });
        </script>
    </div>
@endif
