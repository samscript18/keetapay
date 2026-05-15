"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import {  LogOut, Menu, Settings, History, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Nav() {
	const { ready, authenticated, login, logout } = usePrivy();
	const pathname = usePathname();
	const router = useRouter();
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<header className="sticky top-0 z-40 border-b border-white/10 bg-background/72 backdrop-blur-xl">
			<div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
				<Link href="/" className="flex items-center gap-2 font-black tracking-tight">
					<span className="grid h-9 w-9 place-items-center rounded-[8px] bg-accent text-black">K</span>
					KeetaPay
				</Link>
				<nav className="hidden items-center gap-2 md:flex">
					{/* <Button asChild variant={pathname === "/" ? "primary" : "ghost"}>
						<Link href="/">
							<Home size={17} />
							Home
						</Link>
					</Button> */}
					{ready && authenticated && (
						<>
							<Button asChild variant={pathname === "/dashboard" ? "primary" : "ghost"}>
								<Link href="/dashboard">
									<WalletCards size={17} />
									Dashboard
								</Link>
							</Button>
							<Button asChild variant={pathname === "/transactions" ? "primary" : "ghost"}>
								<Link href="/transactions">
									<History size={17} />
									Transactions
								</Link>
							</Button>
							<Button asChild variant="ghost">
								<Link href="/settings">
									<Settings size={17} />
									Settings
								</Link>
							</Button>
						</>
					)}
				</nav>
				<div className="flex items-center gap-2">
					{ready && authenticated ? (
						<>
							<Button variant="secondary" className="hidden md:inline-flex" onClick={() => logout().then(() => router.push("/"))}>
								<LogOut size={17} /> Logout
							</Button>
							<button
								type="button"
								className="inline-flex items-center justify-center rounded-[8px] border border-white/10 p-2 text-white/70 md:hidden"
								aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
								onClick={() => setMobileOpen((open) => !open)}
							>
								{mobileOpen ? <X size={18} /> : <Menu size={18} />}
							</button>
						</>
					) : (
						<Button onClick={login} loading={!ready}>
							Get Started
						</Button>
					)}
				</div>
			</div>
			{ready && authenticated ? (
				<div className={mobileOpen ? "border-t border-white/10 bg-background/80 px-4 py-3 md:hidden" : "hidden"}>
					<div className="grid gap-2">
						{/* <Button asChild variant={pathname === "/" ? "primary" : "ghost"} onClick={() => setMobileOpen(false)}>
							<Link href="/">
								<Home size={17} />
								Home
							</Link>
						</Button> */}
						<Button asChild variant={pathname === "/dashboard" ? "primary" : "ghost"} onClick={() => setMobileOpen(false)}>
							<Link href="/dashboard">
								<WalletCards size={17} />
								Dashboard
							</Link>
						</Button>
						<Button asChild variant={pathname === "/transactions" ? "primary" : "ghost"} onClick={() => setMobileOpen(false)}>
							<Link href="/transactions">
								<History size={17} />
								Transactions
							</Link>
						</Button>
						<Button asChild variant="ghost" onClick={() => setMobileOpen(false)}>
							<Link href="/settings">
								<Settings size={17} />
								Settings
							</Link>
						</Button>
						<Button variant="secondary" onClick={() => logout().then(() => router.push("/"))}>
							<LogOut size={17} /> Logout
						</Button>
					</div>
				</div>
			) : null}
		</header>
	);
}
