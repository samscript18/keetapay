"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SendCard } from "@/features/payments/send-card";
import { api } from "@/lib/api";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";

export default function PaymentLinkPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { ready, authenticated, login } = usePrivy();
  const { token } = useAuthenticatedApi();

  const requestQuery = useQuery({
    queryKey: ["payment-request", params.code],
    queryFn: () => api.paymentRequest(params.code),
  });

  const profileQuery = useQuery({
    queryKey: ["payment-link-profile"],
    enabled: ready && authenticated,
    queryFn: async () => {
      const authToken = await token();
      return api.sync(authToken);
    },
  });

  useEffect(() => {
    if (requestQuery.error) toast.error(requestQuery.error.message);
  }, [requestQuery.error]);

  useEffect(() => {
    if (profileQuery.error) toast.error(profileQuery.error.message);
  }, [profileQuery.error]);

  useEffect(() => {
    if (profileQuery.data?.needsUsername) router.replace("/dashboard");
  }, [profileQuery.data, router]);

  const request = requestQuery.data ?? null;
  const loading = requestQuery.isLoading;

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <Card className="w-full max-w-lg">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="mt-5 h-8 w-52" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-6 h-44 w-full" />
        </Card>
      </main>
    );
  }

  if (!request || request.expired) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <Card className="w-full max-w-lg text-center">
          <h1 className="text-3xl font-black">Payment link expired</h1>
          <p className="mt-3 text-sm leading-6 text-white/52">
            Ask the recipient to generate a new Keeta Pay link.
          </p>
          <Button className="mt-6" onClick={() => router.push("/")}>
            Back home
          </Button>
        </Card>
      </main>
    );
  }

  const recipient = request.recipientUserId;

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-4 px-4 py-8 lg:grid-cols-[.85fr_1fr]">
      <Card>
        <Avatar
          src={recipient.profileImage}
          username={recipient.username}
          size="lg"
        />
        <h1 className="mt-5 text-4xl font-black">Pay @{recipient.username}</h1>
        <p className="mt-3 text-sm leading-6 text-white/54">
          {request.message ||
            recipient.bio ||
            "Complete this Keeta Pay request."}
        </p>
        <div className="mt-6 rounded-[8px] border border-accent/20 bg-accent/10 p-4">
          <p className="text-sm text-accent">Requested amount</p>
          <p className="mt-1 text-4xl font-black">{request.amount} KTA</p>
        </div>
      </Card>

      {ready && authenticated ? (
        <SendCard
          lockedRecipient={recipient}
          initialAmount={request.amount}
          initialMessage={request.message || ""}
          onSent={() =>
            window.setTimeout(() => router.replace("/dashboard"), 2100)
          }
        />
      ) : (
        <Card>
          <h2 className="text-2xl font-black">Sign in to pay</h2>
          <p className="mt-3 text-sm leading-6 text-white/52">
            Privy verifies your session. Keeta Pay sends the KTA transfer from
            your Keeta wallet.
          </p>
          <Button className="mt-6 w-full" onClick={login} loading={!ready}>
            Continue with Privy
          </Button>
        </Card>
      )}
    </main>
  );
}
