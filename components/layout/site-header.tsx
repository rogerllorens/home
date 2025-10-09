"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Locale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";
import { cn } from "@/lib/utils";

const navItems = ["features", "pricing", "safety", "blog", "faq", "about", "support", "jobs", "press", "roadmap"] as const;
const navPaths: Record<(typeof navItems)[number], string> = {
  features: "features",
  pricing: "pricing",
  safety: "safety",
  blog: "blog",
  faq: "faq",
  about: "about",
  support: "support",
  jobs: "jobs",
  press: "press",
  roadmap: "roadmap"
};

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 backdrop-blur-lg transition-all",
        scrolled ? "bg-black/70 shadow-lg" : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between gap-6 py-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 text-lg font-semibold">
          <span className="rounded-xl bg-[#FF7A00] px-2 py-1 text-black">Xder</span>
          <span className="hidden text-sm text-muted md:inline">{t("tagline")}</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-5 text-sm font-medium lg:flex">
          {navItems.map((item) => {
            const href = `/${locale}/${navPaths[item]}`;
            return (
              <Link
                key={item}
                href={href}
                className={cn(
                  "rounded-xl px-3 py-2 transition hover:bg-white/10",
                  pathname?.startsWith(href) && "bg-white/10 text-foreground"
                )}
              >
                {t(`nav.${item}`)}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher currentLocale={locale} />
          <Button asChild className="hidden sm:inline-flex">
            <Link href={`/${locale}/download`}>{t("ctaDownload")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
