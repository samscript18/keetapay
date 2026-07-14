import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isAppLocale, localeCookie } from "./locales";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get(localeCookie)?.value;
  const locale = isAppLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
});
