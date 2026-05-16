"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowLeft, BadgeCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/app-shell";
import UsernamePill from "@/components/shared/username-pill";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { WithdrawCard } from "@/features/payments/withdraw-card";
import { api } from "@/lib/api";
import { shortAddress } from "@/lib/utils";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";

export default function WithdrawPage() {
	const router = useRouter();
	const { authenticated } = usePrivy();
	const { token } = useAuthenticatedApi();

	const query = useQuery({
		queryKey: ["withdraw-profile"],
		enabled: authenticated,
		queryFn: async () => {
			const authToken = await token();
			const sync = await api.sync(authToken);
			if (sync.needsUsername) return { needsUsername: true as const };
			const balance = await api.balance(authToken);
			return { needsUsername: false as const, user: sync.user, balance: balance.balance };
		},
	});

	useEffect(() => {
		if (query.data?.needsUsername) router.push("/onboarding");
	}, [query.data, router]);

	useEffect(() => {
		if (query.error) toast.error(query.error.message);
	}, [query.error]);

	const loading = query.isLoading || query.data?.needsUsername;
	const user = query.data?.needsUsername ? undefined : query.data?.user;
	const balance = query.data?.needsUsername ? "0" : (query.data?.balance ?? "0");

	return (
		<AppShell>
			<div className="mx-auto max-w-6xl px-4 py-8">
				<Link href="/dashboard" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-white/54 hover:text-white">
					<ArrowLeft size={16} /> Dashboard
				</Link>

				{loading ? (
					<WithdrawSkeleton />
				) : (
					<>
						<section className="relative overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.055]">
							<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
							<div className="relative grid gap-6 p-5 md:grid-cols-[1fr_300px] md:p-7">
								<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
									<Avatar src={user?.profileImage} username={user?.username} size="lg" />
									<div className="min-w-0">
										<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
											<WalletCards size={14} /> External withdrawal
										</div>
										<div className="pt-1.5 pb-4">
											<UsernamePill username={user?.username} proof={user?.identityProof} size="lg" />
										</div>
									</div>
								</div>

								<div className="rounded-[8px] border border-white/10 bg-black/20 p-4">
									<p className="text-xs font-bold uppercase tracking-[0.18em] text-white/34">Wallet</p>
									<p className="mt-3 break-all font-mono text-sm text-white/68">{shortAddress(user?.walletAddress)}</p>
									<p className="mt-5 text-xs text-white/42">Available balance</p>
									<p className="mt-1 text-3xl font-black">
										{balance} <span className="text-base text-white/45">KTA</span>
									</p>
								</div>
							</div>
						</section>

						<div className="mt-4 grid gap-4 md:grid-cols-[1fr_360px]">
							<WithdrawCard username={user?.username ?? "user"} />
							<Card>
								<BadgeCheck className="text-accent" />
								<h2 className="mt-4 text-lg font-bold">Verified withdrawal</h2>
								<p className="mt-2 text-sm leading-6 text-white/52">Your Keeta SDK certificate state is attached to the withdrawal record.</p>
							</Card>
						</div>
					</>
				)}
			</div>
		</AppShell>
	);
}

function WithdrawSkeleton() {
	return (
		<div className="grid gap-4">
			<Card>
				<Skeleton className="h-16 w-16 rounded-full" />
				<Skeleton className="mt-5 h-12 w-60" />
				<Skeleton className="mt-4 h-4 w-full max-w-md" />
			</Card>
			<Card>
				<Skeleton className="h-10" />
				<Skeleton className="mt-3 h-10" />
				<Skeleton className="mt-3 h-24" />
			</Card>
		</div>
	);
}
