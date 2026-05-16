"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CheckCircle2, WalletCards } from "lucide-react";
import { toast } from "sonner";
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
	const [walletAddress, setWalletAddress] = useState("");
	const [amount, setAmount] = useState("");
	const [message, setMessage] = useState("");
	const [success, setSuccess] = useState(false);

	const mutation = useMutation({
		mutationFn: async () => {
			const controller = new AbortController();
			paymentStatus.start(controller, "Preparing your external Keeta withdrawal.");
			const authToken = await token();
			paymentStatus.setStatus("processing", "Sending KTA to the recipient wallet address.");
			const result = await api.withdraw(authToken, { walletAddress: walletAddress.trim(), amount, message }, controller.signal);
			return result;
		},
		onSuccess: async () => {
			setSuccess(true);
			paymentStatus.setStatus("sent", "Withdrawal sent successfully.");
			toast.success("KTA withdrawn", { description: "Returning to your dashboard in 2 seconds." });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["transactions"] });
			window.setTimeout(() => {
				paymentStatus.close();
				router.push("/dashboard");
			}, 2000);
		},
		onError: (error) => {
			if (error instanceof DOMException && error.name === "AbortError") {
				toast.message("Withdrawal cancelled");
				return;
			}
			const description = error instanceof Error ? error.message : "Try again";
			paymentStatus.fail(description);
			toast.error("Withdrawal failed", { description });
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
						<WalletCards size={14} /> External wallet
					</div>
					<h2 className="text-lg font-bold">Withdraw from @{username}</h2>
					<p className="mt-2 text-sm leading-6 text-white/52">Send KTA to a Keeta wallet address outside KeetaPay.</p>
				</div>
				{success ? <CheckCircle2 className="shrink-0 text-accent" /> : <ArrowUpRight className="shrink-0 text-white/54" />}
			</div>

			<form onSubmit={submit} className="space-y-3">
				<Input value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} placeholder="Recipient Keeta wallet address" />
				<Input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="Amount in KTA" />
				<Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Optional note" />
				<Button className="w-full" loading={mutation.isPending} disabled={!walletAddress.trim() || !amount}>
					{mutation.isPending ? "Withdrawing..." : "Withdraw KTA"}
				</Button>
			</form>
		</Card>
	);
}
