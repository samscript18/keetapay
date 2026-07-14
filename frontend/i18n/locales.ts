export const locales = ["en", "pt-BR", "zh-CN", "fr"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";
export const localeCookie = "KEETAPAY_LOCALE";

export function isAppLocale(value: string | undefined): value is AppLocale {
  return Boolean(value && locales.includes(value as AppLocale));
}
