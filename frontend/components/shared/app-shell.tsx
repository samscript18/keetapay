"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { History, LayoutDashboard, Link2, LogOut, Settings } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/requests", label: "Requests", icon: Link2 },
	{ href: "/transactions", label: "History", icon: History },
	{ href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const { ready, authenticated, logout } = usePrivy();

	useEffect(() => {
		if (ready && !authenticated) {
			router.replace("/");
		}
	}, [ready, authenticated, router]);

	async function signOut() {
		await logout();
		router.push("/");
	}

	if (!ready || !authenticated) {
		return (
			<main className="relative grid min-h-screen place-items-center overflow-hidden px-4">
				<div className="absolute h-72 w-72 animate-pulse rounded-full bg-accent/15 blur-3xl" />
				<div className="relative text-center">
					<div className="mx-auto grid h-20 w-20 animate-[spin_3s_linear_infinite] place-items-center rounded-[18px] border border-accent/25 bg-accent text-4xl font-black text-black shadow-glow">K</div>
					<h1 className="mt-6 text-3xl font-black">KeetaPay</h1>
					<div className="mx-auto mt-4 flex w-44 items-center justify-center gap-2">
						<span className="h-2 w-2 animate-bounce rounded-full bg-accent" />
						<span className="h-2 w-2 animate-bounce rounded-full bg-sky [animation-delay:120ms]" />
						<span className="h-2 w-2 animate-bounce rounded-full bg-coral [animation-delay:240ms]" />
					</div>
					<p className="mt-5 text-sm text-white/50">{ready ? "Taking you back to sign in..." : "Restoring your secure session..."}</p>
				</div>
			</main>
		);
	}

	return (
		<div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
			<aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-white/10 bg-background/82 px-4 py-5 backdrop-blur-xl lg:flex lg:flex-col">
				<Link href="/dashboard" className="flex items-center gap-3 px-2 font-black tracking-tight">
					<span className="grid h-10 w-10 place-items-center rounded-[8px] bg-accent text-black">K</span>
					KeetaPay
				</Link>
				<nav className="mt-12 space-y-12">
					{navItems.map((item) => {
						const Icon = item.icon;
						const active = pathname === item.href;
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex h-12 items-center gap-3 rounded-[8px] px-3 text-sm font-semibold text-white/62 transition hover:bg-white/10 hover:text-white",
									active && "bg-accent text-black hover:bg-accent hover:text-black",
								)}
							>
								<Icon size={18} />
								{item.label}
							</Link>
						);
					})}
				</nav>
				<Button variant="secondary" className="mt-auto w-full" onClick={signOut}>
					<LogOut size={17} /> Logout
				</Button>
			</aside>

			<header className="sticky top-0 z-30 border-b border-white/10 bg-background/78 px-4 py-3 backdrop-blur-xl lg:hidden">
				<div className="flex items-center justify-between">
					<Link href="/dashboard" className="flex items-center gap-2 font-black">
						<span className="grid h-9 w-9 place-items-center rounded-[8px] bg-accent text-black">K</span>
						KeetaPay
					</Link>
					<button className="rounded-[8px] border border-white/10 px-3 py-2 text-sm text-white/70" onClick={signOut}>
						Logout
					</button>
				</div>
			</header>

			<main className="min-w-0 pb-24 lg:col-start-2 lg:pb-0">{children}</main>

			<nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-background/88 px-2 py-2 backdrop-blur-xl lg:hidden">
				{navItems.map((item) => {
					const Icon = item.icon;
					const active = pathname === item.href;
					return (
						<Link key={item.href} href={item.href} className={cn("flex flex-col items-center gap-1 rounded-[8px] px-2 py-2 text-xs font-semibold text-white/48", active && "bg-accent/15 text-accent")}>
							<Icon size={19} />
							{item.label}
						</Link>
					);
				})}
			</nav>
		</div>
	);
}
