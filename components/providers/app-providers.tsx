'use client';

import { NextIntlClientProvider } from 'next-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { FeatureFlagProvider } from '@/components/feature-flag-provider';
import { SessionProvider } from '@/components/session-provider';
import { Toaster } from '@/components/ui/toaster';

type Props = {
  locale: string;
  messages: Record<string, any>;
  children: React.ReactNode;
};

export function AppProviders({ locale, messages, children }: Props) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 30,
        refetchOnWindowFocus: false,
        retry: 1
      }
    }
  }));

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Europe/Madrid">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <FeatureFlagProvider>
            <SessionProvider>
              {children}
              <Toaster position="top-right" richColors expand />
            </SessionProvider>
          </FeatureFlagProvider>
        </ThemeProvider>
        <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} />
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
