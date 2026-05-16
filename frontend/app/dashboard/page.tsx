"use client";

import { Suspense, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, BadgeCheck, Clock3, Copy, ExternalLink, Sparkles, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveFeed } from "@/features/feed/live-feed";
import { SendCard } from "@/features/payments/send-card";
import { ActivityList } from "@/features/profile/activity-list";
import { api } from "@/lib/api";
import { shortAddress } from "@/lib/utils";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";
import { usePrivy } from "@privy-io/react-auth";

export default function DashboardPage() {
	return (
		<Suspense fallback={<DashboardFallback />}>
			<DashboardContent />
		</Suspense>
	);
}

function DashboardContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const initialRecipientUsername = searchParams.get("recipient");
	const { authenticated } = usePrivy();
	const { token } = useAuthenticatedApi();
	const dashboardQuery = useQuery({
		queryKey: ["dashboard"],
		enabled: authenticated,
		queryFn: async () => {
			const authToken = await token();
			const sync = await api.sync(authToken);
			if (sync.needsUsername) return { needsUsername: true as const };
			const [balance, history] = await Promise.all([api.balance(authToken), api.history(authToken)]);
			return {
				needsUsername: false as const,
				user: sync.user,
				balance: balance.balance,
				history,
			};
		},
	});

	useEffect(() => {
		if (dashboardQuery.data?.needsUsername) router.push("/onboarding");
	}, [dashboardQuery.data, router]);

	useEffect(() => {
		if (dashboardQuery.error) toast.error(dashboardQuery.error.message);
	}, [dashboardQuery.error]);

	const loading = dashboardQuery.isLoading || dashboardQuery.data?.needsUsername;
	const user = dashboardQuery.data?.needsUsername ? undefined : dashboardQuery.data?.user;
	const balance = dashboardQuery.data?.needsUsername ? "0" : (dashboardQuery.data?.balance ?? "0");
	const history = dashboardQuery.data?.needsUsername ? [] : (dashboardQuery.data?.history ?? []);

	return (
		<AppShell>
			{loading ? null : <LiveFeed compact />}
			<div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[1fr_380px]">
				{loading ? (
					<DashboardSkeleton />
				) : (
					<>
						<section className="space-y-4">
							<Card className="relative overflow-hidden p-0">
								<div className="relative p-5">
									<div className="flex items-start justify-between gap-4">
										<div>
											<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
												<BadgeCheck size={14} /> Keeta testnet wallet
											</div>
											<p className="text-sm text-white/45">Available balance</p>
											<h1 className="mt-2 text-5xl font-black tabular-nums md:text-6xl" title={balance}>
												{formatBalance(balance)} <span className="text-xl text-white/45">KTA</span>
											</h1>
											<p className="mt-3 text-sm text-white/50">Keeta testnet wallet: {shortAddress(user?.walletAddress)}</p>
										</div>
										<button
											className="rounded-[8px] border border-white/10 bg-black/20 p-3 hover:bg-white/10"
											onClick={() => navigator.clipboard.writeText(user?.username ?? "").then(() => toast.success("Username copied"))}
											aria-label="Copy username"
										>
											<Copy size={18} />
										</button>
									</div>
									<div className="mt-6 grid gap-3 sm:grid-cols-3">
										<Metric label="This week" value={`${history.length} payments`} icon={Clock3} />
										<Metric label="Identity" value={`@${user?.username}`} icon={Sparkles} />
										<Metric label="Network" value="Testnet" icon={WalletCards} />
									</div>
								</div>
							</Card>
						</section>
						<aside className="space-y-4">
							<Card className="h-full">
								<Avatar src={user?.profileImage} username={user?.username} size="lg" />
								<h2 className="mt-4 text-2xl font-black">@{user?.username}</h2>
								<p className="mt-2 text-sm leading-6 text-white/55">
									{user?.bio
										? (() => {
												const words = user.bio.trim().split(/\s+/);
												return words.length > 25 ? words.slice(0, 25).join(" ") + "..." : user.bio;
											})()
										: "No bio available"}
								</p>
								<a className="mt-5 flex items-center gap-2 text-sm text-accent" href={`/u/${user?.username}`}>
									View public profile <ExternalLink size={15} />
								</a>
								<Link
									className="mt-6 flex h-11 items-center justify-center gap-2 rounded-[8px] border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white hover:bg-white/10"
									href="/withdraw"
								>
									Withdraw KTA <ArrowUpRight size={15} />
								</Link>
							</Card>
						</aside>
						<div className="col-span-full">
							<SendCard initialRecipientUsername={initialRecipientUsername} />
						</div>
						<Card className="col-span-full">
							<h2 className="mb-4 text-lg font-bold">Recent activity</h2>
							<ActivityList transactions={history} currentUsername={user?.username} />
						</Card>
					</>
				)}
			</div>
		</AppShell>
	);
}

function DashboardFallback() {
	return (
		<AppShell>
			<div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 lg:grid-cols-[1fr_380px]">
				<DashboardSkeleton />
			</div>
		</AppShell>
	);
}

function formatBalance(value: string) {
	if (!value) return "0";

	const [rawInt, rawFrac = ""] = value.split(".");
	const intPart = rawInt.replace(/^0+(?=\d)/, "");
	const len = intPart.length;

	if (len >= 4) {
		const compactSteps = [
			{ minLen: 13, suffix: "T", shift: 12 },
			{ minLen: 10, suffix: "B", shift: 9 },
			{ minLen: 7, suffix: "M", shift: 6 },
			{ minLen: 4, suffix: "K", shift: 3 },
		];
		const step = compactSteps.find((item) => len >= item.minLen);

		if (step) {
			const lead = intPart.slice(0, len - step.shift);
			const next = intPart.slice(len - step.shift, len - step.shift + 1);
			return `${lead}${next ? `.${next}` : ""}${step.suffix}`;
		}
	}

	const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	const frac = rawFrac.replace(/0+$/, "").slice(0, 6);
	return frac ? `${withCommas}.${frac}` : withCommas;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
	return (
		<div className="rounded-[8px] border border-white/10 bg-black/20 p-3">
			<div className="mb-2 flex items-center gap-2 text-xs text-white/42">
				<Icon size={14} /> {label}
			</div>
			<p className="truncate text-sm font-bold text-white">{value}</p>
		</div>
	);
}

function DashboardSkeleton() {
	return (
		<>
			<section className="space-y-4">
				<Card>
					<Skeleton className="h-6 w-40" />
					<Skeleton className="mt-5 h-14 w-64" />
					<Skeleton className="mt-4 h-4 w-full max-w-md" />
					<div className="mt-6 grid gap-3 sm:grid-cols-3">
						<Skeleton className="h-20" />
						<Skeleton className="h-20" />
						<Skeleton className="h-20" />
					</div>
				</Card>
				<Card>
					<Skeleton className="h-6 w-36" />
					<Skeleton className="mt-5 h-12" />
					<Skeleton className="mt-3 h-12" />
					<Skeleton className="mt-3 h-24" />
				</Card>
			</section>
			<aside className="space-y-4">
				<Card>
					<Skeleton className="h-16 w-16 rounded-full" />
					<Skeleton className="mt-4 h-7 w-32" />
					<Skeleton className="mt-3 h-4 w-full" />
					<Skeleton className="mt-2 h-4 w-3/4" />
				</Card>
			</aside>
		</>
	);
}
