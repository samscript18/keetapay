"use client";

import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Globe2, MessageCircle, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
import { Nav } from "@/components/shared/nav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LiveFeed } from "@/features/feed/live-feed";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api, ApiTransaction } from "@/lib/api";
import { shortAddress } from "@/lib/utils";
import { toast } from "sonner";
import { ActivityCard } from "@/components/common/activity-card";

const fallbackCreatedAt = "2026-05-16T12:00:00.000Z";

const fallback: ApiTransaction[] = [
	{
		_id: "demo-lane-milo",
		fromUserId: { id: "demo-lane", username: "lane", walletAddress: "demo-lane" },
		toUserId: { id: "demo-milo", username: "milo", walletAddress: "demo-milo" },
		amount: "12",
		message: "studio snack fund",
		txHash: "demo-lane-milo",
		blockHash: "demo-lane-milo",
		createdAt: fallbackCreatedAt,
	},
	{
		_id: "demo-nora-kai",
		fromUserId: { id: "demo-nora", username: "nora", walletAddress: "demo-nora" },
		toUserId: { id: "demo-kai", username: "kai", walletAddress: "demo-kai" },
		amount: "9",
		message: "late-night render",
		txHash: "demo-nora-kai",
		blockHash: "demo-nora-kai",
		createdAt: fallbackCreatedAt,
	},
	{
		_id: "demo-june-faye",
		fromUserId: { id: "demo-june", username: "june", walletAddress: "demo-june" },
		toUserId: { id: "demo-faye", username: "faye", walletAddress: "demo-faye" },
		amount: "40",
		message: "studio rent",
		txHash: "demo-june-faye",
		blockHash: "demo-june-faye",
		createdAt: fallbackCreatedAt,
	},
	{
		_id: "demo-maya-rio",
		fromUserId: { id: "demo-maya", username: "maya", walletAddress: "demo-maya" },
		toUserId: { id: "demo-rio", username: "rio", walletAddress: "demo-rio" },
		amount: "3",
		message: "lunch run",
		txHash: "demo-maya-rio",
		blockHash: "demo-maya-rio",
		createdAt: fallbackCreatedAt,
	},
];

export default function LandingPage() {
	const { login, ready, authenticated, getAccessToken } = usePrivy();
	const router = useRouter();

	const [items, setItems] = useState<ApiTransaction[]>([]);

	useEffect(() => {
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
	}, []);

	const display = useMemo(() => {
		if (items.length) {
			return items.filter((tx) => !tx.isPrivate).map((tx) => ({
				key: tx._id,
				from: tx.fromUserId?.username ?? "user",
				to: tx.toUserId?.username ?? shortAddress(tx.toWalletAddress),
				amount: tx.amount,
				message: tx.message || "sent KTA",
				avatar: tx.fromUserId?.profileImage,
				blockHash: tx.blockHash,
				createdAt: tx.createdAt,
			}));
		}
		return fallback.map((tx) => ({
			key: tx._id,
			from: tx.fromUserId.username ?? "user",
			to: tx.toUserId?.username ?? "friend",
			amount: tx.amount,
			message: tx.message || "sent KTA",
			avatar: tx.fromUserId.profileImage,
		}));
	}, [items]);

	useEffect(() => {
		if (!ready || !authenticated) return;
		getAccessToken()
			.then(async (token) => {
				if (!token) return;
				const sync = await api.sync(token);
				const needsUsername: boolean = sync.needsUsername ? true : false;
				router.replace(needsUsername ? "/onboarding" : "/dashboard");
			})
			.catch((error) => {
				toast.error("Could not finish sign in", {
					description: error instanceof Error ? error.message : "Please try again.",
				});
			});
	}, [ready, authenticated, getAccessToken, router]);

	const liveDrops = items.length ? items : fallback;
	const verticalDrops = [...liveDrops, ...liveDrops];

	return (
		<main className="relative overflow-hidden">
			<div aria-hidden className="pointer-events-none absolute inset-0">
				<div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-accent/20 blur-[120px]" />
				<div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-sky/20 blur-[140px]" />
				<div className="absolute left-1/2 top-[28rem] h-64 w-64 -translate-x-1/2 rounded-full bg-coral/20 blur-[120px]" />
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
			</div>
			<Nav />
			<section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-12 px-4 py-14 lg:grid-cols-[1.05fr_.95fr]">
				<motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
					<div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
						<Sparkles size={14} /> Verified Keeta payments
					</div>
					<h1 className="font-display max-w-4xl text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
						Send verified crypto payments.
						<span className="block bg-gradient-to-r from-accent via-sky to-coral bg-clip-text text-transparent">Verified, instant, and easy.</span>
					</h1>
					<p className="mt-6 max-w-2xl text-lg leading-8 text-white/62">KeetaPay lets you move crypto with verified @usernames and SDK-backed identity checks.</p>
					<div className="mt-8 flex flex-col gap-3 sm:flex-row">
						<Button onClick={login}>
							Get Started <ArrowRight size={18} />
						</Button>
						<Button variant="secondary" asChild>
							<a href="#demo">View Demo</a>
						</Button>
					</div>
					<div className="mt-10 grid gap-4 sm:grid-cols-3">
						<div className="rounded-[10px] border border-white/10 bg-white/[0.05] px-4 py-3">
							<p className="text-xs uppercase tracking-[0.2em] text-white/45">Avg send time</p>
							<p className="font-display mt-2 text-2xl font-black">2.4s</p>
						</div>
						<div className="rounded-[10px] border border-white/10 bg-white/[0.05] px-4 py-3">
							<p className="text-xs uppercase tracking-[0.2em] text-white/45">Verified profiles</p>
							<p className="font-display mt-2 text-2xl font-black">1.3k</p>
						</div>
						<div className="rounded-[10px] border border-white/10 bg-white/[0.05] px-4 py-3">
							<p className="text-xs uppercase tracking-[0.2em] text-white/45">Live volume</p>
							<p className="font-display mt-2 text-2xl font-black">82k KTA</p>
						</div>
					</div>
				</motion.div>
				<motion.div id="demo" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
					<Card className="shadow-glow animate-pulse">
						<div className="mb-5 flex items-center justify-between">
							<div>
								<p className="text-sm text-white/45">Available balance</p>
								<p className="text-4xl font-black">128.40 KTA</p>
							</div>
							<div className="rounded-full bg-accent/15 px-3 py-1 text-sm text-accent">@alex</div>
						</div>
						<div className="rounded-[8px] bg-black/30 p-4">
							<p className="text-sm text-white/48">To</p>
							<p className="mt-1 text-2xl font-bold">@jayden</p>
							<p className="mt-5 text-sm text-white/48">Amount</p>
							<p className="mt-1 text-4xl font-black text-accent">5 KTA</p>
							<div className="mt-5 rounded-[8px] bg-white/8 p-3 text-sm text-white/70">Sales payment</div>
						</div>
						<Button className="mt-5 w-full">Send in one tap</Button>
					</Card>
				</motion.div>
			</section>
			<section className="mx-auto max-w-7xl px-4 py-8">
				<div className="grid gap-4 border border-white/10 bg-white/[0.04] p-5 text-sm text-white/55 md:grid-cols-3">
					<div className="flex items-center gap-3">
						<Users className="text-accent" />
						<span>10k+ social transfers routed</span>
					</div>
					<div className="flex items-center gap-3">
						<Globe2 className="text-accent" />
						<span>SDK-verified payment identities</span>
					</div>
					<div className="flex items-center gap-3">
						<ShieldCheck className="text-accent" />
						<span>SDK-backed identity checks</span>
					</div>
				</div>
			</section>
			<LiveFeed compact display={display} />
			<section className="mx-auto max-w-7xl px-4 py-16">
				<div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
					<Card className="lg:row-span-2">
						<div className="flex items-center gap-3 text-accent">
							<MessageCircle />
							<p className="text-sm uppercase tracking-[0.2em]">Verified transfer</p>
						</div>
						<h3 className="font-display mt-4 text-2xl font-black">Pay verified usernames fast</h3>
						<p className="mt-4 text-sm leading-6 text-white/54">Search verified @usernames, add KTA, and tap send. The feed stays lively.</p>
						<div className="mt-6 rounded-[10px] border border-white/10 bg-white/[0.06] p-4 text-sm text-white/70">
							<p className="text-xs uppercase tracking-[0.2em] text-white/45">Now playing</p>
							<p className="font-display mt-2 text-lg font-bold">"studio rent"</p>
							<p className="mt-1 text-white/50">@june → @faye · 40 KTA</p>
						</div>
					</Card>
					<Card>
						<Zap className="mb-5 text-accent" />
						<h3 className="font-display text-xl font-bold">Keeta identity inside</h3>
						<p className="mt-3 text-sm leading-6 text-white/54">Wallets, certificates, and transfers run through the Keeta SDK.</p>
					</Card>
					<Card>
						<ShieldCheck className="mb-5 text-accent" />
						<h3 className="font-display text-xl font-bold">Secure access only</h3>
						<p className="mt-3 text-sm leading-6 text-white/54">Email, Google, and Twitter/X sessions with SDK identity checks.</p>
					</Card>
					<Card>
						<BadgeCheck className="mb-5 text-accent" />
						<h3 className="font-display text-xl font-bold">SDK identity checks</h3>
						<p className="mt-3 text-sm leading-6 text-white/54">Usernames resolve to Keeta certificates with verified status.</p>
					</Card>
					<Card>
						<Sparkles className="mb-5 text-accent" />
						<h3 className="font-display text-xl font-bold">Trust-led payments</h3>
						<p className="mt-3 text-sm leading-6 text-white/54">Make verified transfers feel social, polished, and simple.</p>
					</Card>
				</div>
			</section>
			<section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 lg:grid-cols-2">
				<div>
					<h2 className="font-display text-3xl font-black">How it works</h2>
					<p className="mt-3 text-white/55">Login, verify identity, claim a wallet, and pay socially.</p>
					<div className="group relative z-50 mt-11 w-full h-[488px] overflow-hidden rounded-[14px] border border-white/10 bg-gradient-to-br from-white/[0.1] via-white/[0.055] to-accent/[0.08] p-4 text-sm text-white/70 shadow-glow backdrop-blur-xl">
						<div aria-hidden className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
						<div className="flex items-center justify-between">
							<p className="text-xs uppercase tracking-[0.2em] text-white/45">Live Feed</p>
							<span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_18px_rgba(39,241,154,0.9)]" />
						</div>
						<div className="relative mt-4 h-auto overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_5%,black_82%,transparent)]">
							<div className="animate-live-drop space-y-4 group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]">
								{verticalDrops.map((drop, index) => (
									<ActivityCard key={`${drop._id}-${index}`} transaction={drop} />
								))}
							</div>
						</div>
					</div>
				</div>
				<div className="space-y-5">
					{[
						"Secure login powered by Privy authentication",
						"SDK certificate issued for every KeetaPay wallet",
						"Sensitive Wallet keys are securely stored and never exposed to the user",
						"Verified usernames replace complex wallet addresses",
						"Users can search and select recipients instantly",
						"Transfers are signed securely using the user’s encrypted wallet",
						"Transactions are broadcast and processed on the Keeta testnet",
						"SDK verification keeps profile trust transparent",
					].map((step, i) => (
						<div key={step} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
							<BadgeCheck className="text-accent" />
							<span className="text-sm">
								{i + 1}. {step}
							</span>
						</div>
					))}
				</div>
			</section>
			<section className="mx-auto max-w-7xl px-4 pb-20">
				<div className="grid gap-4 rounded-[16px] border border-white/10 bg-gradient-to-r from-white/[0.08] via-white/[0.03] to-transparent p-8 md:grid-cols-[1.2fr_0.8fr]">
					<div>
						<p className="text-xs uppercase tracking-[0.2em] text-white/45">Ready to ship</p>
						<h2 className="font-display mt-4 text-3xl font-black md:text-4xl">Launch verified payments fast.</h2>
						<p className="mt-4 text-white/55">Sign in, verify identity, and start sending KTA.</p>
					</div>
					<div className="flex items-center md:justify-end">
						<Button onClick={login}>
							Get Started <ArrowRight size={18} />
						</Button>
					</div>
				</div>
			</section>
			<footer className="border-t border-white/10 px-4 py-10 text-center text-sm text-white/42">Built for the Keeta Coding Challenge.</footer>
		</main>
	);
}
