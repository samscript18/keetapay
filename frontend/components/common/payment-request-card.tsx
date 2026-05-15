"use client";

import { Copy, ExternalLink, QrCode } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ApiPaymentRequest } from "@/types/api";

export function PaymentRequestCard({
  request,
}: {
  request: ApiPaymentRequest;
}) {
  const expired = isExpired(request);
  const url = paymentRequestUrl(request.code);

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span
            className={
              expired
                ? "rounded-full border border-white/10 px-2 py-1 text-xs font-bold text-white/45"
                : "rounded-full bg-accent/12 px-2 py-1 text-xs font-bold text-accent"
            }
          >
            {expired ? "Expired" : "Active"}
          </span>
          <p className="mt-4 text-3xl font-black">{request.amount} KTA</p>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">
            {request.message || "Payment request"}
          </p>
        </div>
        <QrCode
          className={expired ? "text-white/26" : "text-accent"}
          size={28}
        />
      </div>
      <p className="mt-5 text-xs text-white/42">
        Expires {new Date(request.expiresAt).toLocaleString()}
      </p>
      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="secondary"
          className="min-w-0 flex-1"
          onClick={() =>
            navigator.clipboard
              .writeText(url)
              .then(() => toast.success("Link copied"))
          }
          disabled={expired}
        >
          <Copy size={16} /> Copy
        </Button>
        <Button asChild variant="ghost" className="px-3" disabled={expired}>
          <a href={`/pay/${request.code}`} aria-label="Open payment request">
            <ExternalLink size={17} />
          </a>
        </Button>
      </div>
    </Card>
  );
}

export function isExpired(request: ApiPaymentRequest) {
  return (
    Boolean(request.expired) ||
    new Date(request.expiresAt).getTime() <= Date.now()
  );
}

export function paymentRequestUrl(code: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/pay/${code}`;
}
