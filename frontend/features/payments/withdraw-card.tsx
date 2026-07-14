"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";
import { usePaymentStatusStore } from "@/store/payment-status-store";

export function WithdrawCard({ username }: { username: string }) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { token } = useAuthenticatedApi();
	const paymentStatus = usePaymentStatusStore();
	const t = useTranslations("withdraw");
	const [walletAddress, setWalletAddress] = useState("");
	const [amount, setAmount] = useState("");
	const [message, setMessage] = useState("");
	const [success, setSuccess] = useState(false);

	const mutation = useMutation({
		mutationFn: async () => {
			const controller = new AbortController();
			paymentStatus.start(controller, t("preparing"));
			const authToken = await token();
			paymentStatus.setStatus("processing", t("processing"));
			const result = await api.withdraw(authToken, { walletAddress: walletAddress.trim(), amount, message }, controller.signal);
			return result;
		},
		onSuccess: async () => {
			setSuccess(true);
			paymentStatus.setStatus("sent", t("sent"));
			toast.success(t("successTitle"), { description: t("successDescription") });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["transactions"] });
			window.setTimeout(() => {
				paymentStatus.close();
				router.push("/dashboard");
			}, 2000);
		},
		onError: (error) => {
			if (error instanceof DOMException && error.name === "AbortError") {
				toast.message(t("cancelled"));
				return;
			}
			const description = error instanceof Error ? error.message : t("tryAgain");
			paymentStatus.fail(description);
			toast.error(t("failed"), { description });
		},
	});

	function submit(event: FormEvent) {
		event.preventDefault();
		setSuccess(false);
		mutation.mutate();
	}

	return (
		<Card className="w-full">
			<div className="mb-5 flex items-start justify-between gap-4">
				<div>
					<div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
						<WalletCards size={14} /> {t("badge")}
					</div>
					<h2 className="text-lg font-bold">{t("title", { username })}</h2>
					<p className="mt-2 text-sm leading-6 text-white/52">{t("description")}</p>
				</div>
				{success ? <CheckCircle2 className="shrink-0 text-accent" /> : <ArrowUpRight className="shrink-0 text-white/54" />}
			</div>

			<form onSubmit={submit} className="space-y-3">
				<Input value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} placeholder={t("walletPlaceholder")} />
				<Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder={t("amountPlaceholder")} />
				<Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t("notePlaceholder")} />
				<Button className="w-full" loading={mutation.isPending} disabled={!walletAddress.trim() || !amount}>
					{mutation.isPending ? t("withdrawing") : t("action")}
				</Button>
			</form>
		</Card>
	);
}
