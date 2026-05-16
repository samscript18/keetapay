"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/app-shell";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ActivityList } from "@/features/profile/activity-list";
import { LiveFeed } from "@/features/feed/live-feed";
import { api } from "@/lib/api";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";
import { TransactionFilter } from "@/types/api";

export default function TransactionsPage() {
	const router = useRouter();
	const { authenticated } = usePrivy();
	const { token } = useAuthenticatedApi();
	const [filter, setFilter] = useState<TransactionFilter>("all");

	const historyQuery = useQuery({
		queryKey: ["transactions"],
		enabled: authenticated,
		queryFn: async () => {
			const authToken = await token();
			const sync = await api.sync(authToken);
			if (sync.needsUsername) return { needsUsername: true as const };
			return {
				needsUsername: false as const,
				user: sync.user,
				history: await api.history(authToken),
			};
		},
	});

	useEffect(() => {
		if (historyQuery.data?.needsUsername) router.push("/onboarding");
	}, [historyQuery.data, router]);

	useEffect(() => {
		if (historyQuery.error) toast.error(historyQuery.error.message);
	}, [historyQuery.error]);

	const loading = historyQuery.isLoading || historyQuery.data?.needsUsername;
	const history = historyQuery.data?.needsUsername ? [] : (historyQuery.data?.history ?? []);
	const username = historyQuery.data?.needsUsername ? undefined : historyQuery.data?.user.username;
	const filteredHistory = useMemo(() => {
		if (!username || filter === "all") return history;
		return history.filter((tx) => (filter === "sent" ? tx.fromUserId?.username === username : tx.toUserId?.username === username));
	}, [filter, history, username]);
	const sentCount = useMemo(() => history.filter((tx) => tx.fromUserId?.username === username).length, [history, username]);
	const receivedCount = useMemo(() => history.filter((tx) => tx.toUserId?.username === username).length, [history, username]);

	return (
		<AppShell>
			<LiveFeed compact />
			<div className="mx-auto max-w-5xl px-4 py-8">
				<Card>
					<div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div className="w-full">
							<h1 className="text-3xl font-black">Transaction history</h1>
							<p className="mt-2 text-sm text-white/48">Every KTA payment sent or received by your KeetaPay username.</p>
						</div>
						{!loading && (
							<div className="w-full flex rounded-[8px] border border-white/10 bg-white/[0.04] p-1">
								{[
									{ key: "all", label: "All", count: history.length },
									{ key: "sent", label: "Sent", count: sentCount },
									{ key: "received", label: "Received", count: receivedCount },
								].map((item) => (
									<button
										key={item.key}
										type="button"
										onClick={() => setFilter(item.key as TransactionFilter)}
										className={
											filter === item.key
												? "w-full rounded-[6px] bg-accent p-2 text-sm font-bold text-black"
												: "w-full rounded-[6px] p-2 text-sm font-semibold text-white/56 hover:text-white"
										}
									>
										{item.label} <span className="tabular-nums">({item.count})</span>
									</button>
								))}
							</div>
						)}
					</div>
					{loading ? <TransactionSkeleton /> : <ActivityList transactions={filteredHistory} currentUsername={username} emptyMessage={emptyMessageFor(filter)} />}
				</Card>
			</div>
		</AppShell>
	);
}

function TransactionSkeleton() {
	return (
		<div className="space-y-3">
			{Array.from({ length: 5 }).map((_, index) => (
				<div key={index} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] p-3">
					<Skeleton className="h-8 w-8 rounded-full" />
					<div className="flex-1">
						<Skeleton className="h-4 w-2/3" />
						<Skeleton className="mt-2 h-3 w-1/2" />
					</div>
					<Skeleton className="h-4 w-16" />
				</div>
			))}
		</div>
	);
}

function emptyMessageFor(filter: TransactionFilter) {
	if (filter === "sent") return "No sent transactions yet.";
	if (filter === "received") return "No received transactions yet.";
	return "No transactions yet.";
}
