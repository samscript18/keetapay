"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { AppLocale, localeCookie, locales } from "@/i18n/locales";

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("locale");

  function changeLocale(nextLocale: AppLocale) {
    document.cookie = `${localeCookie}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <label className="relative inline-flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.04] px-2 text-sm text-white/70">
      <Languages size={15} aria-hidden="true" />
      <span className={compact ? "sr-only" : "hidden xl:inline"}>{t("label")}</span>
      <select
        aria-label={t("label")}
        className="h-9 appearance-none bg-transparent pr-5 text-sm font-semibold outline-none"
        value={locale}
        onChange={(event) => changeLocale(event.target.value as AppLocale)}
      >
        {locales.map((item) => (
          <option key={item} value={item} className="bg-[#10141b] text-white">
            {t(item)}
          </option>
        ))}
      </select>
    </label>
  );
}
