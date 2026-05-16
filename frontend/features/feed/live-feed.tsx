"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import UsernamePill from "@/components/shared/username-pill";
import { api } from "@/lib/api";
import type { ApiTransaction } from "@/types/api";

type Display = {
	key: string;
	from: string;
	to: string;
	amount: string;
	message: string;
	avatar: string | undefined;
}[];

const fallback = [
	{ key: "demo-alex-emma", from: "alex", to: "emma", amount: "5", message: "coffee", avatar: undefined },
	{ key: "demo-sam-lisa", from: "sam", to: "lisa", amount: "12", message: "tickets", avatar: undefined },
	{ key: "demo-maya-rio", from: "maya", to: "rio", amount: "3", message: "lunch", avatar: undefined },
	{ key: "demo-nora-kai", from: "nora", to: "kai", amount: "9", message: "studio split", avatar: undefined },
];

export function LiveFeed({ compact = false, display }: { compact?: boolean; display?: Display }) {
	const [items, setItems] = useState<ApiTransaction[]>([]);

	useEffect(() => {
		if (display) return;

		let mounted = true;
		const load = async () => {
			try {
				const feed = await api.feed();
				if (mounted) setItems(feed);
			} catch {
				if (mounted) setItems([]);
			}
		};

		load();
		const id = setInterval(load, 7000);
		return () => {
			mounted = false;
			clearInterval(id);
		};
	}, [display]);

	const resolvedDisplay = useMemo(() => {
		if (display?.length) return display;
		if (items.length) {
			return items.map((tx) => ({
				key: tx._id,
				from: tx.fromUserId?.username ?? "user",
				to: tx.toUserId?.username ?? "friend",
				amount: tx.amount,
				message: tx.message || "sent KTA",
				avatar: tx.fromUserId?.profileImage,
			}));
		}
		return fallback;
	}, [display, items]);

	const lane = [...resolvedDisplay, ...resolvedDisplay];

	return (
		<div className={compact ? "group overflow-hidden border-y border-white/10 bg-white/[0.03] py-2" : "group overflow-hidden py-4"}>
			<div className="flex w-max animate-marquee gap-3 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
				{lane.map((item, index) => (
					<div key={`${item.key}-${index}`} className="glass flex min-w-[330px] items-center gap-3 rounded-[8px] px-4 py-2">
						<Avatar src={(item as any).avatar} username={item.from} size="sm" />
						<p className="flex min-w-0 items-center gap-2 truncate text-sm text-white/82">
							<UsernamePill username={item.from} /> <span>sent</span> <span className="font-semibold text-accent">{item.amount} KTA</span> <span>to</span>{" "}
							<UsernamePill username={item.to} variant="sky" />
							{"message" in item && <span className="text-white/45"> · {item.message}</span>}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
