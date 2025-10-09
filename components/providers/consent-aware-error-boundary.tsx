'use client';

import type { ComponentType, ReactNode } from 'react';
import { useEffect, useState } from 'react';

const CONSENT_STORAGE_KEY = 'tkn:cookie-consent';
const CONSENT_EVENT_NAME = 'tkn:cookie-consent-accepted';

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

export function ConsentAwareErrorBoundary({ children, fallback }: Props) {
  const [Boundary, setBoundary] = useState<ComponentType<{ children: ReactNode; fallback: ReactNode }> | null>(null);

  useEffect(() => {
    const loadBoundary = async () => {
      const sentryModule = await import('@sentry/nextjs');
      setBoundary(() => sentryModule.ErrorBoundary);
    };

    const hasConsent = () => {
      if (typeof window === 'undefined') return false;
      return window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'accepted';
    };

    if (hasConsent()) {
      loadBoundary().catch(() => undefined);
      return;
    }

    const handler = () => {
      if (hasConsent()) {
        loadBoundary().catch(() => undefined);
      }
    };

    window.addEventListener(CONSENT_EVENT_NAME, handler);
    return () => {
      window.removeEventListener(CONSENT_EVENT_NAME, handler);
    };
  }, []);

  if (!Boundary) {
    return <>{children}</>;
  }

  return <Boundary fallback={fallback}>{children}</Boundary>;
}
