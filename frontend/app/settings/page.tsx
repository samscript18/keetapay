"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, Copy, Loader, Mail, ShieldCheck, Twitter, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shared/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiUser } from "@/lib/api";
import { shortAddress } from "@/lib/utils";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";
import { usePrivy } from "@privy-io/react-auth";

export default function SettingsPage() {
	const { token } = useAuthenticatedApi();
	const { authenticated, user: privyUser, linkEmail, linkGoogle, linkTwitter } = usePrivy();
	const [user, setUser] = useState<ApiUser | null>(null);
	const [originalUsername, setOriginalUsername] = useState("");
	const [saving, setSaving] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [available, setAvailable] = useState<boolean | null>(null);
	const [checkingUsername, setCheckingUsername] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (!authenticated) return;
		token()
			.then((t) =>
				api.me(t).then((profile) => {
					setUser(profile);
					setOriginalUsername(profile.username ?? "");
				}),
			)
			.catch(() => {});
	}, [authenticated, token]);

	useEffect(() => {
		if (!user?.username) return;
		const id = setTimeout(async () => {
			setCheckingUsername(true);
			try {
				const result = await api.availability(user.username!);
				setAvailable(result.available || user.username === originalUsername);
			} finally {
				setCheckingUsername(false);
			}
		}, 300);
		return () => clearTimeout(id);
	}, [originalUsername, user?.username]);

	async function submit(event: FormEvent) {
		event.preventDefault();
		if (!user) return;
		setSaving(true);
		try {
			const authToken = await token();
			const updated = await api.updateSettings(authToken, {
				username: user.username,
				bio: user.bio,
			});
			setUser(updated);
			toast.success("Settings saved");
		} catch (error) {
			toast.error("Could not save settings", { description: error instanceof Error ? error.message : "Try again" });
		} finally {
			setSaving(false);
		}
	}

	async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
		const file = event.target.files?.[0];
		if (!file) return;
		setUploadingAvatar(true);
		try {
			const authToken = await token();
			const updated = await api.uploadAvatar(authToken, file);
			setUser(updated);
			toast.success("Avatar updated");
		} catch (error) {
			toast.error("Avatar upload failed", { description: error instanceof Error ? error.message : "Try another image" });
		} finally {
			setUploadingAvatar(false);
			event.target.value = "";
		}
	}

	return (
		<AppShell>
			<div className="mx-auto flex flex-col max-w-5xl gap-8 px-4 py-8">
				{!user ? (
					<SettingsSkeleton />
				) : (
					<>
						<Card className="h-fit">
							<div className="relative mx-auto w-fit">
								<Avatar src={user.profileImage} username={user.username} size="lg" />
								<button
									type="button"
									aria-label="Upload avatar"
									onClick={() => fileInputRef.current?.click()}
									disabled={uploadingAvatar}
									className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-accent text-black shadow-glow transition hover:bg-[#6affbc]"
								>
									{uploadingAvatar ? <Loader className="animate-spin" size={17} /> : <Camera size={17} />}
								</button>
								<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
							</div>
							<h1 className="mt-5 text-center text-3xl font-black">@{user.username}</h1>
							<p className="mt-2 text-center text-sm leading-6 text-white/52">{user.bio}</p>
							<div className="mt-5 rounded-[8px] border border-accent/20 bg-accent/10 p-3 text-sm text-accent text-center">
								{uploadingAvatar ? (
									<div className="flex justify-center items-center gap-x-4">
										<Loader className="animate-spin" size={18} />
										<span>Uploading avatar...</span>
									</div>
								) : (
									<span>Profile image is stored securely.</span>
								)}
							</div>
						</Card>

						<Card>
							<div className="mb-6 flex items-center gap-3">
								<div className="grid h-11 w-11 place-items-center rounded-[8px] bg-white/8">
									<UserRound size={20} />
								</div>
								<div>
									<h2 className="text-2xl font-black">Account settings</h2>
									<p className="text-sm text-white/48">Update your social payment identity.</p>
								</div>
							</div>
							<form onSubmit={submit} className="space-y-4">
								<div>
									<label className="mb-2 block text-sm font-semibold text-white/70">Username</label>
									<Input
										value={user.username ?? ""}
										onChange={(e) => setUser((u) => (u ? { ...u, username: e.target.value.toLowerCase().replace("@", "") } : u))}
										placeholder="username"
									/>
									{checkingUsername ? (
										<Skeleton className="mt-2 h-4 w-44" />
									) : (
										<p className={available === false ? "mt-2 text-sm text-coral" : available ? "mt-2 text-sm text-accent" : "mt-2 text-sm text-white/45"}>
											{available === false
												? "That username is not available."
												: available
													? "Username is available."
													: "Username availability is checked before saving."}
										</p>
									)}
								</div>
								<div>
									<label className="mb-2 block text-sm font-semibold text-white/70">Bio</label>
									<Textarea value={user.bio ?? ""} onChange={(e) => setUser((u) => (u ? { ...u, bio: e.target.value } : u))} placeholder="Bio" />
								</div>
								<div className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/[0.04] p-3">
									<div>
										<p className="text-xs text-white/42">Keeta testnet wallet</p>
										<span className="text-sm text-white/70 max-lg:hidden">{user.walletAddress}</span>
										<span className="text-sm text-white/70 lg:hidden">{shortAddress(user.walletAddress)}</span>
									</div>
									<button
										type="button"
										aria-label="Copy wallet"
										onClick={() => navigator.clipboard.writeText(user.walletAddress).then(() => toast.success("Wallet address copied"))}
									>
										<Copy size={18} />
									</button>
								</div>
								<div className="flex justify-center items-center gap-2 rounded-[8px] bg-white/[0.04] p-3 text-sm text-white/52">
									<ShieldCheck size={17} className="text-accent" />
									Sensitive informations are stored securely.
								</div>
								<Button loading={saving} disabled={available === false}>
									{saving ? "Saving..." : "Save settings"}
								</Button>
							</form>
						</Card>

						<Card>
							<div className="mb-6 flex items-center gap-3">
								<div className="grid h-11 w-11 place-items-center rounded-[8px] bg-accent/10 text-accent">
									<ShieldCheck size={20} />
								</div>
								<div>
									<h2 className="text-2xl font-black">Sign-in methods</h2>
									<p className="text-sm text-white/48">Link email, Google, and X(coming soon) to the same KeetaPay account.</p>
								</div>
							</div>
							<div className="grid gap-3">
								<SignInMethod
									label="Email"
									description={privyUser?.email?.address ?? "Add email OTP login"}
									connected={Boolean(privyUser?.email)}
									icon={Mail}
									onLink={() => {
										linkEmail();
										toast.message("Opening Privy email linking");
									}}
								/>
								<SignInMethod
									label="Google"
									description={privyUser?.google?.email ?? "Add Google login"}
									connected={Boolean(privyUser?.google)}
									icon={GoogleGlyph}
									onLink={() => {
										linkGoogle();
										toast.message("Redirecting to Google");
									}}
								/>
								<SignInMethod
									label="X / Twitter"
									description={privyUser?.twitter?.username ? `@${privyUser.twitter.username}` : "Add X login"}
									connected={Boolean(privyUser?.twitter)}
									icon={Twitter}
									onLink={() => {
										linkTwitter();
										toast.message("Redirecting to X");
									}}
									disabled
								/>
							</div>
							<p className="mt-4 rounded-[8px] bg-white/[0.04] p-3 text-sm leading-6 text-white/50">
								These methods all resolve to the same account, so your Keeta username, wallet, and transaction history stay attached to one account.
							</p>
						</Card>
					</>
				)}
			</div>
		</AppShell>
	);
}

function SignInMethod({ label, description, connected, icon: Icon, onLink, disabled = false }: { label: string; description: string; connected: boolean; icon: React.ElementType; onLink: () => void; disabled?: boolean }) {
	return (
		<div className="flex flex-col gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex min-w-0 items-center gap-3">
				<div className={connected ? "grid h-11 w-11 place-items-center rounded-[8px] bg-accent/15 text-accent" : "grid h-11 w-11 place-items-center rounded-[8px] bg-white/8 text-white/58"}>
					<Icon size={19} />
				</div>
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<p className="font-bold">{label}</p>
						{connected && <CheckCircle2 size={15} className="text-accent" />}
					</div>
					<p className="truncate text-sm text-white/45">{description}</p>
				</div>
			</div>
			<Button type="button" variant={connected ? "secondary" : "primary"} onClick={onLink} disabled={disabled}>
				{connected ? "Linked" : disabled ? "Coming soon" : "Link"}
			</Button>
		</div>
	);
}

function GoogleGlyph({ size = 19 }: { size?: number }) {
	return (
		<span style={{ width: size, height: size }} className="grid place-items-center text-sm font-black">
			G
		</span>
	);
}

function SettingsSkeleton() {
	return (
		<>
			<Card>
				<Skeleton className="mx-auto h-16 w-16 rounded-full" />
				<Skeleton className="mx-auto mt-5 h-8 w-32" />
				<Skeleton className="mt-4 h-4 w-full" />
				<Skeleton className="mt-2 h-4 w-3/4" />
			</Card>
			<Card>
				<Skeleton className="h-8 w-48" />
				<Skeleton className="mt-6 h-12" />
				<Skeleton className="mt-4 h-28" />
				<Skeleton className="mt-4 h-14" />
			</Card>
		</>
	);
}
