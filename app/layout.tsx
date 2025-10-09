import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AppProviders } from '@/components/providers/app-providers';
import { AppHeader } from '@/components/layout/app-header';
import { AppFooter } from '@/components/layout/app-footer';
import { AgeGate } from '@/components/layout/age-gate';
import { CookieConsent } from '@/components/layout/cookie-consent';
import { DEFAULT_LOCALE, getMessages } from '@/lib/i18n';
import { ErrorBoundary } from '@sentry/nextjs';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '600', '700'], variable: '--font-poppins' });

export const metadata: Metadata = {
  title: 'TKN Social Platform',
  description: 'Plataforma social con chat 1:1, grupos, perfiles y foro impulsados por Créditos (TKN).' 
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = DEFAULT_LOCALE;
  const messages = getMessages(locale);

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={cn(inter.variable, poppins.variable, 'bg-bg text-text')}>
        <ErrorBoundary
          fallback={
            <div className="flex min-h-screen flex-col items-center justify-center bg-bg text-center text-text">
              <p className="text-lg font-heading">Algo salió mal.</p>
              <p className="mt-2 text-sm text-text-muted">Recarga la página o contacta con soporte si el problema persiste.</p>
            </div>
          }
        >
          <AppProviders locale={locale} messages={messages}>
            <div className="flex min-h-screen flex-col bg-bg">
              <AppHeader />
              <AgeGate />
              <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 px-4 pb-24 pt-28">
                {children}
              </main>
              <AppFooter />
              <CookieConsent />
            </div>
          </AppProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
