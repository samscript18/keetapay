import type { Metadata } from "next";
import { Toaster } from "sonner";
import { PaymentStatusModal } from "@/components/common/payment-status-modal";
import { QueryProvider } from "@/components/common/query-provider";
import { PrivyProviders } from "@/features/auth/privy-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "KeetaPay",
  description: "Send KTA tokens to usernames instead of wallet addresses.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <PrivyProviders>
          <QueryProvider>
            {children}
            <PaymentStatusModal />
            <Toaster richColors theme="dark" position="top-right" />
          </QueryProvider>
        </PrivyProviders>
      </body>
    </html>
  );
}
