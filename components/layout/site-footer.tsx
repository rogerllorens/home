import Link from "next/link";
import { useTranslations } from "next-intl";
import { Locale } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SiteFooter({ locale }: { locale: Locale }) {
  const footer = useTranslations("common.footer");
  const newsletter = useTranslations("common.newsletter");

  return (
    <footer className="mt-24 border-t border-white/10 bg-black/60">
      <div className="container grid gap-12 py-16 md:grid-cols-4">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Xder</h3>
          <p className="text-sm text-muted">{footer("newsletterDescription")}</p>
          <form className="flex flex-col gap-3" aria-label="Newsletter form">
            <Input type="email" placeholder={newsletter("email")} required aria-label={newsletter("email")} />
            <Button type="submit">{newsletter("submit")}</Button>
            <p className="text-xs text-muted">{newsletter("success")}</p>
          </form>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide">{footer("legal")}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href={`/${locale}/privacy`}>{footer("privacy")}</Link>
            </li>
            <li>
              <Link href={`/${locale}/terms`}>{footer("terms")}</Link>
            </li>
            <li>
              <Link href={`/${locale}/cookies`}>{footer("cookies")}</Link>
            </li>
            <li>
              <Link href={`/${locale}/legal/bases-juridicas`}>{footer("bases")}</Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide">{footer("contact")}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href={`/${locale}/contact`}>{footer("contact")}</Link>
            </li>
            <li>
              <Link href={`/${locale}/support`}>{locale === "en" ? "Help center" : "Centro de ayuda"}</Link>
            </li>
            <li>
              <Link href={`/${locale}/download`}>{footer("download")}</Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wide">{footer("follow")}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="https://www.instagram.com/xderapp">Instagram</Link>
            </li>
            <li>
              <Link href="https://www.linkedin.com/company/xder">LinkedIn</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-muted">
        © {new Date().getFullYear()} Xder. {footer("rights")}.
      </div>
    </footer>
  );
}
