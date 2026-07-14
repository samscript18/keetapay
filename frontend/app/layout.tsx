import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Toaster } from "sonner";
import { PaymentStatusModal } from "@/components/common/payment-status-modal";
import { QueryProvider } from "@/components/common/query-provider";
import { PrivyProviders } from "@/features/auth/privy-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "KeetaPay",
  description: "Send crypto like message. Instant, secure, and easy-to-use",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="dark">
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PrivyProviders>
            <QueryProvider>
              {children}
              <PaymentStatusModal />
              <Toaster richColors theme="dark" position="top-right" />
            </QueryProvider>
          </PrivyProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
