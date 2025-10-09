import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function AppFooter() {
  const t = useTranslations('footer');
  return (
    <footer className="border-t border-muted/60 bg-surface/70">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-sm text-text-muted md:flex-row md:items-center md:justify-between">
        <span className="text-text-muted/80">© {new Date().getFullYear()} TKN Social</span>
        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/legal/tos" className="hover:text-text">
            {t('tos')}
          </Link>
          <Link href="/legal/privacy" className="hover:text-text">
            {t('privacy')}
          </Link>
          <Link href="/legal/content" className="hover:text-text">
            {t('content')}
          </Link>
          <Link href="/legal/dmca" className="hover:text-text">
            {t('dmca')}
          </Link>
          <Link href="/legal/transparency" className="hover:text-text">
            Transparencia
          </Link>
          <a href="mailto:contacto@tuweb.com" className="hover:text-text">
            contacto@tuweb.com
          </a>
        </nav>
      </div>
    </footer>
  );
}
