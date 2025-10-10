'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'tkn:cookie-consent';
const CONSENT_EVENT_NAME = 'tkn:cookie-consent-accepted';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    setVisible(!stored);
  }, []);

  const accept = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'accepted');
      window.dispatchEvent(new Event(CONSENT_EVENT_NAME));
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(90vw,480px)] -translate-x-1/2 rounded-3xl border border-muted/60 bg-surface/95 p-4 shadow-xl backdrop-blur">
      <p className="text-xs text-text-muted">
        Usamos cookies esenciales para sesión y moderación. Solo habilitaremos analítica si das tu consentimiento.
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={accept}>
          Aceptar
        </Button>
      </div>
    </div>
  );
}
