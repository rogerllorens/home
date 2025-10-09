"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function LocaleSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (locale: Locale) => {
    if (locale === currentLocale) return;
    const segments = pathname?.split("/") ?? [];
    segments[1] = locale;
    const nextPath = segments.join("/") || "/";
    startTransition(() => router.push(nextPath));
  };

  return (
    <div className="flex items-center gap-2" aria-label="Language switcher">
      {locales.map((locale) => (
        <Button
          key={locale}
          type="button"
          size="sm"
          variant={locale === currentLocale ? "default" : "outline"}
          onClick={() => handleSwitch(locale)}
          aria-pressed={locale === currentLocale}
          disabled={isPending && locale === currentLocale}
          className={cn("min-w-[88px]", isPending && locale === currentLocale && "opacity-80")}
        >
          {localeNames[locale]}
        </Button>
      ))}
    </div>
  );
}
