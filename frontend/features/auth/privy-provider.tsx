"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

export function PrivyProviders({ children }: { children: React.ReactNode }) {
	const t = useTranslations("system");
	const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

	useEffect(() => {
		const originalError = console.error;
		console.error = (...args) => {
			const message = args.map(String).join(" ");
			const isPrivyOtpNestingWarning =
				message.includes("cannot be a descendant of <p>") ||
				message.includes("cannot contain a nested <div>") ||
				message.includes("ancestor stack trace") ||
				message.includes("HelpTextContainer") ||
				message.includes("at p (<anonymous>");

			if (isPrivyOtpNestingWarning) return;
			originalError(...args);
		};

		return () => {
			console.error = originalError;
		};
	}, []);

	if (!appId || appId === "your_privy_app_id") {
		return (
			<main className="grid min-h-screen place-items-center bg-background px-4 text-foreground">
				<div className="max-w-md rounded-[8px] border border-white/10 bg-white/[0.06] p-6">
					<h1 className="text-2xl font-black">{t("privyRequired")}</h1>
					<p className="mt-3 text-sm leading-6 text-white/58">
						{t("privyInstructions")}
					</p>
				</div>
			</main>
		);
	}

	return (
		<PrivyProvider
			appId={appId}
			config={{
				loginMethods: ["email", "google", "twitter"],
				appearance: {
					theme: "dark",
					accentColor: "#27f19a",
					logo: "https://dummyimage.com/128x128/07090d/27f19a&text=KeetaPay",
				},
				externalWallets: {
					disableAllExternalWallets: true,
				},
			}}
		>
			{children}
		</PrivyProvider>
	);
}
