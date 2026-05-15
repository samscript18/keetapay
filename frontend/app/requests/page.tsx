"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, ShieldCheck, Timer, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/app-shell";
import {
  PaymentRequestCard,
  isExpired,
  paymentRequestUrl,
} from "@/components/common/payment-request-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";
import type { ApiPaymentRequest } from "@/types/api";

export default function RequestsPage() {
  const { token } = useAuthenticatedApi();
  const [amount, setAmount] = useState("25");
  const [message, setMessage] = useState("settle up");
  const [expiresIn, setExpiresIn] = useState<"15m" | "1h" | "24h" | "7d">("1h");
  const [request, setRequest] = useState<ApiPaymentRequest | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "expired">("all");
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ["payment-requests"],
    queryFn: async () => {
      const authToken = await token();
      return api.paymentRequests(authToken);
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async () => {
      const authToken = await token();
      return api.createPaymentRequest(authToken, {
        amount,
        message,
        expiresIn,
      });
    },
    onSuccess: async (created) => {
      setRequest(created);
      queryClient.setQueryData<ApiPaymentRequest[]>(
        ["payment-requests"],
        (items = []) => [
          created,
          ...items.filter((item) => item._id !== created._id),
        ],
      );
      const url = paymentRequestUrl(created.code);
      await navigator.clipboard.writeText(url).catch(() => undefined);
      toast.success("Payment link generated", {
        description: "The link was copied to your clipboard.",
      });
    },
    onError: (error) => {
      toast.error("Could not generate request", {
        description: error instanceof Error ? error.message : "Try again",
      });
    },
  });

  const requestUrl = request ? paymentRequestUrl(request.code) : "";
  const requests = requestsQuery.data ?? [];
  const filteredRequests = useMemo(() => {
    if (filter === "active") return requests.filter((item) => !isExpired(item));
    if (filter === "expired") return requests.filter((item) => isExpired(item));
    return requests;
  }, [filter, requests]);
  const activeCount = requests.filter((item) => !isExpired(item)).length;
  const expiredCount = requests.length - activeCount;

  async function submit(event: FormEvent) {
    event.preventDefault();
    createRequestMutation.mutate();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <section className="relative overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.06] p-6">
          <div className="absolute right-6 top-6 hidden h-28 w-28 rounded-full bg-accent/15 blur-3xl md:block" />
          <div className="relative max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
              <WandSparkles size={14} /> Payment requests
            </div>
            <h1 className="text-4xl font-black md:text-6xl">
              Receive KTA with a link.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/56">
              Generate an expiring KeetaPay link with your username locked in.
              The payer can edit the amount before sending, but never needs your
              wallet address.
            </p>
          </div>
        </section>

        <div className="mt-4 w-full">
          <Card>
            <div className="mb-6 grid gap-3 md:grid-cols-3">
              <InfoTile
                icon={Timer}
                label="Expiry"
                value={expiresInLabel(expiresIn)}
              />
              <InfoTile icon={ShieldCheck} label="Recipient" value="You" />
              <InfoTile icon={Link2} label="Format" value="Shareable link" />
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Requested amount
                </label>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  inputMode="decimal"
                  placeholder="Amount in KTA"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What is this request for?"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white/70">
                  Expiration
                </label>
                <select
                  value={expiresIn}
                  onChange={(e) =>
                    setExpiresIn(e.target.value as "15m" | "1h" | "24h" | "7d")
                  }
                  className="h-12 w-full rounded-[8px] border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none"
                >
                  <option value="15m">15 minutes</option>
                  <option value="1h">1 hour</option>
                  <option value="24h">24 hours</option>
                  <option value="7d">7 days</option>
                </select>
              </div>
              <Button
                loading={createRequestMutation.isPending}
                className="w-full"
              >
                {createRequestMutation.isPending
                  ? "Generating..."
                  : request
                    ? "Generate another link"
                    : "Generate payment link"}
              </Button>
            </form>
          </Card>
          {/* 
          <aside className="space-y-4">
            <Card className="min-h-[360px]">
              {request ? (
                <>
                  <div className="grid h-20 w-20 place-items-center rounded-[8px] bg-accent text-black">
                    <QrCode size={36} />
                  </div>
                  <h2 className="mt-5 text-2xl font-black">Link ready</h2>
                  <p className="mt-2 text-sm leading-6 text-white/52">Share this with anyone who needs to send you KTA.</p>
                  <div className="mt-5 rounded-[8px] border border-accent/20 bg-accent/10 p-4">
                    <p className="text-sm text-accent">Requested</p>
                    <p className="mt-1 text-4xl font-black">{request.amount} KTA</p>
                    <p className="mt-3 text-xs text-white/45">Expires {new Date(request.expiresAt).toLocaleString()}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.04] p-3">
                    <p className="min-w-0 flex-1 truncate text-sm text-white/62">{requestUrl}</p>
                    <button type="button" className="text-accent" onClick={() => navigator.clipboard.writeText(requestUrl).then(() => toast.success('Link copied'))}>
                      <Copy size={18} />
                    </button>
                  </div>
                  <Button variant="secondary" className="mt-4 w-full" onClick={() => setRequest(null)}>
                    <RefreshCw size={17} /> Reset
                  </Button>
                </>
              ) : (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <div className="mx-auto grid h-20 w-20 place-items-center rounded-[8px] border border-white/10 bg-white/[0.04]">
                      <Link2 className="text-accent" size={34} />
                    </div>
                    <h2 className="mt-5 text-2xl font-black">No link yet</h2>
                    <p className="mt-2 text-sm leading-6 text-white/48">Fill the form and Keeta Pay will create a secure request link.</p>
                  </div>
                </div>
              )}
            </Card>
          </aside> */}
        </div>

        <section className="mt-10">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Generated requests</h2>
              <p className="text-sm text-white/48">
                {activeCount} active, {expiredCount} expired
              </p>
            </div>
            <div className="grid grid-cols-3 rounded-[8px] border border-white/10 bg-white/[0.04] p-1">
              {[
                ["all", `All ${requests.length}`],
                ["active", `Active ${activeCount}`],
                ["expired", `Expired ${expiredCount}`],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key as typeof filter)}
                  className={
                    filter === key
                      ? "rounded-[6px] bg-accent px-3 py-2 text-sm font-bold text-black"
                      : "rounded-[6px] px-3 py-2 text-sm font-semibold text-white/56 hover:text-white"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {requestsQuery.isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="min-h-[176px] animate-pulse">
                  <div className="h-5 w-24 rounded bg-white/10" />
                  <div className="mt-5 h-8 w-32 rounded bg-white/10" />
                  <div className="mt-5 h-10 rounded bg-white/10" />
                </Card>
              ))
            ) : filteredRequests.length ? (
              filteredRequests.map((item) => (
                <PaymentRequestCard key={item._id} request={item} />
              ))
            ) : (
              <Card className="md:col-span-2 xl:col-span-3">
                <div className="grid min-h-[160px] place-items-center text-center">
                  <div>
                    <Link2 className="mx-auto text-white/36" size={32} />
                    <p className="mt-3 text-sm font-semibold text-white/62">
                      No {filter === "all" ? "" : filter} requests found.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
      <Icon size={18} className="text-accent" />
      <p className="mt-3 text-xs text-white/42">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function expiresInLabel(value: "15m" | "1h" | "24h" | "7d") {
  return {
    "15m": "15 minutes",
    "1h": "1 hour",
    "24h": "24 hours",
    "7d": "7 days",
  }[value];
}
