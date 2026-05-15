import { ArrowDownLeft, ArrowUpRight, CalendarDays, Copy, ExternalLink, WalletCards } from "lucide-react";
import { Nav } from "@/components/shared/nav";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ActivityList } from "@/features/profile/activity-list";
import { api } from "@/lib/api";
import { shortAddress } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
	const { username } = await params;
	const [user, history] = await Promise.all([api.publicUser(username), api.publicHistory(username)]);
	const sent = history.filter((tx) => tx.fromUserId?.username === user.username).length;
	const received = history.filter((tx) => tx.toUserId?.username === user.username).length;
	const totalVolume = history.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

	return (
		<main className="min-h-screen">
			<Nav />
			<div className="mx-auto max-w-6xl px-4 py-8">
				<section className="relative overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.055]">
					<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
					<div className="absolute right-8 top-8 hidden h-40 w-40 rounded-full bg-accent/10 blur-3xl md:block" />
					<div className="relative grid gap-6 p-5 md:grid-cols-[1fr_300px] md:p-7">
						<div className="flex flex-col gap-5 sm:flex-row sm:items-center">
							<Avatar src={user.profileImage} username={user.username} size="lg" />
							<div className="min-w-0">
								<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
									<WalletCards size={14} /> KeetaPay profile
								</div>
								<h1 className="truncate text-5xl font-black md:text-6xl mb-1">@{user.username}</h1>
								<p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">{user.bio}</p>
							</div>
						</div>

						<div className="rounded-[8px] border border-white/10 bg-black/20 p-4">
							<p className="text-xs font-bold uppercase tracking-[0.18em] text-white/34">Wallet</p>
							<p className="mt-3 break-all font-mono text-sm text-white/68">{shortAddress(user.walletAddress)}</p>
							<a
								href={`https://explorer.test.keeta.com/account/${user.walletAddress}`}
								target="_blank"
								rel="noreferrer"
								className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent/80"
							>
								View account <ExternalLink size={15} />
							</a>
						</div>
					</div>
				</section>

				<section className="mt-4 grid gap-3 md:grid-cols-4">
					<ProfileMetric label="Payments" value={String(history.length)} icon={CalendarDays} />
					<ProfileMetric label="Sent" value={String(sent)} icon={ArrowUpRight} />
					<ProfileMetric label="Received" value={String(received)} icon={ArrowDownLeft} />
					<ProfileMetric label="Volume" value={`${formatCompact(totalVolume)} KTA`} icon={Copy} />
				</section>

				<div className="flex max-lg:flex-col justify-between items-center my-4 gap-4">
					<Card className="w-full h-max">
						<h2 className="text-lg font-bold">Pay @{user.username}</h2>
						<p className="mt-2 text-sm leading-6 text-white/52">
							Start a secure transfer from your dashboard with this recipient already selected, making payments faster and more convenient. This recipient will already be filled in for you so
							you can quickly make a seamless transfer from your dashboard without needing to enter their username or wallet address.
						</p>
						<a
							href={`/dashboard?recipient=${user.username}`}
							className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-accent px-4 text-sm font-black text-black hover:bg-accent/90"
						>
							Send KTA
						</a>
					</Card>
					<Card className="w-full">
						<h2 className="text-lg font-bold">Trust signals</h2>
						<div className="mt-4 space-y-3 text-sm">
							<TrustRow label="Username" value={`@${user.username}`} />
							<TrustRow label="Network" value="Keeta testnet" />
							<TrustRow label="Address" value={shortAddress(user.walletAddress)} />
						</div>
					</Card>
				</div>

				<section className="mt-4">
					<Card>
						<div className="mb-5 flex items-center justify-between gap-4">
							<div>
								<h2 className="text-2xl font-black">Payment history</h2>
								<p className="mt-1 text-sm text-white/45">Public KTA activity for @{user.username}</p>
							</div>
							<span className="rounded-full border border-white/10 px-3 py-1 text-xs font-bold text-white/46">{history.length} total</span>
						</div>
						<ActivityList transactions={history} currentUsername={user.username} />
					</Card>
				</section>
			</div>
		</main>
	);
}

function ProfileMetric({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
	return (
		<div className="rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
			<Icon size={18} className="text-accent" />
			<p className="mt-3 text-xs text-white/42">{label}</p>
			<p className="mt-1 truncate text-2xl font-black">{value}</p>
		</div>
	);
}

function TrustRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-3 rounded-[8px] border border-white/10 bg-white/[0.035] p-3">
			<span className="text-white/42">{label}</span>
			<span className="truncate font-bold">{value}</span>
		</div>
	);
}

function formatCompact(value: number) {
	return new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 1,
		notation: "compact",
	}).format(value);
}
