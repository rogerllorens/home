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
            if (sandbox) {
                iframe.setAttribute('sandbox', sandbox);
            }
            if (allow) {
                iframe.setAttribute('allow', allow);
            }
            iframe.className = 'h-full w-full';

            container.innerHTML = '';
            container.appendChild(iframe);
        });
    });
});
