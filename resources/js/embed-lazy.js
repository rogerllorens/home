document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[data-embed-url]');

    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const url = button.getAttribute('data-embed-url');
            const targetSelector = button.getAttribute('data-embed-container');
            const sandbox = button.getAttribute('data-iframe-sandbox');
            const allow = button.getAttribute('data-iframe-allow');
            const container = targetSelector ? document.querySelector(targetSelector) : button.closest('[data-embed-container]');

            if (!url || !container) {
                return;
            }

            const iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.loading = 'lazy';
            iframe.referrerPolicy = 'no-referrer';
            iframe.allowFullscreen = true;
            iframe.title = 'Video embed';
            if (sandbox) {
                iframe.setAttribute('sandbox', sandbox);
            }
            if (allow) {
                iframe.setAttribute('allow', allow);
            }
            iframe.className = 'h-full w-full';

            container.innerHTML = '';
            container.appendChild(iframe);

            const errorBanner = document.createElement('div');
            errorBanner.className = 'absolute inset-0 hidden items-center justify-center bg-black/70 text-center text-sm text-white';
            errorBanner.setAttribute('data-embed-error', 'true');
            errorBanner.innerHTML = '<div><p class="font-semibold">No se pudo cargar el video.</p><p class="mt-2 text-xs text-slate-200">Por favor intenta de nuevo más tarde.</p></div>';
            container.appendChild(errorBanner);

            let hasLoaded = false;
            const timeoutId = window.setTimeout(() => {
                if (!hasLoaded && errorBanner) {
                    errorBanner.classList.remove('hidden');
                    errorBanner.classList.add('flex');
                }
            }, 8000);

            const clearTimeoutAndHide = () => {
                hasLoaded = true;
                window.clearTimeout(timeoutId);
                if (errorBanner) {
                    errorBanner.classList.add('hidden');
                    errorBanner.classList.remove('flex');
                }
            };

            iframe.addEventListener('load', clearTimeoutAndHide);
            iframe.addEventListener('error', () => {
                window.clearTimeout(timeoutId);
                if (errorBanner) {
                    errorBanner.classList.remove('hidden');
                    errorBanner.classList.add('flex');
                }
            });
        });
    });
});
