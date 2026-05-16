"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, Plus, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiUser } from "@/lib/api";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";
import { usePaymentStatusStore } from "@/store/payment-status-store";
import type { BatchPaymentRow, SelectedUser } from "@/interfaces/payment";

export function SendCard({
	onSent,
	lockedRecipient,
	initialRecipientUsername,
	initialAmount = "",
	initialMessage = "",
}: {
	onSent?: () => void;
	lockedRecipient?: SelectedUser;
	initialRecipientUsername?: string | null;
	initialAmount?: string;
	initialMessage?: string;
}) {
	const { token } = useAuthenticatedApi();
	const queryClient = useQueryClient();
	const paymentStatus = usePaymentStatusStore();
	const [mode, setMode] = useState<"single" | "batch">("single");
	const [recipient, setRecipient] = useState<SelectedUser | undefined>(lockedRecipient);
	const [amount, setAmount] = useState(initialAmount);
	const [message, setMessage] = useState(initialMessage);
	const [batchRows, setBatchRows] = useState<BatchPaymentRow[]>([
		{ id: crypto.randomUUID(), amount: "", message: "" },
		{ id: crypto.randomUUID(), amount: "", message: "" },
	]);
	const [success, setSuccess] = useState(false);
	const appliedInitialRecipient = useRef<string | undefined>(undefined);

	const normalizedInitialRecipient = useMemo(() => initialRecipientUsername?.replace("@", "").toLowerCase().trim(), [initialRecipientUsername]);

	const canSendSingle = Boolean(recipient?.username && amount);

	useEffect(() => {
		if (lockedRecipient) {
			setRecipient(lockedRecipient);
			return;
		}

		if (!normalizedInitialRecipient || appliedInitialRecipient.current === normalizedInitialRecipient) {
			return;
		}

		let cancelled = false;
		appliedInitialRecipient.current = normalizedInitialRecipient;

		api.publicUser(normalizedInitialRecipient)
			.then((user) => {
				if (!cancelled) setRecipient(user);
			})
			.catch(() => {
				if (!cancelled) {
					toast.error("Recipient not found", {
						description: `@${normalizedInitialRecipient} could not be loaded.`,
					});
				}
			});

		return () => {
			cancelled = true;
		};
	}, [lockedRecipient, normalizedInitialRecipient]);

	const mutation = useMutation({
		mutationFn: async () => {
			const controller = new AbortController();
			paymentStatus.start(controller, "Initiating a secure KTA transfer.");
			const authToken = await token();
			paymentStatus.setStatus("processing", "Publishing your transfer to Keeta testnet.");

			if (mode === "batch") {
				const payments = batchRows
					.filter((row) => row.recipient?.username && row.amount)
					.map((row) => ({
						recipient: `@${row.recipient!.username}`,
						amount: row.amount,
						message: row.message,
					}));
				if (!payments.length) throw new Error("Add at least one recipient");
				const result = await api.sendMany(authToken, { payments }, controller.signal);
				return {
					label: "Batch sent",
					description: `${payments.length} KTA payments were submitted.`,
					result,
				};
			}

			if (!recipient?.username) throw new Error("Choose a recipient");
			const result = await api.send(authToken, { recipient: `@${recipient.username}`, amount, message }, controller.signal);
			return {
				label: "KTA sent",
				description: `Explorer: ${result.explorerUrl}`,
				result,
			};
		},
		onSuccess: async (data) => {
			setSuccess(true);
			paymentStatus.setStatus("sent", "Payment sent successfully.");
			toast.success(data.label, { description: data.description });
			await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
			await queryClient.invalidateQueries({ queryKey: ["transactions"] });
			onSent?.();
			window.setTimeout(() => paymentStatus.close(), 2000);
		},
		onError: (error) => {
			if (error instanceof DOMException && error.name === "AbortError") {
				toast.message("Payment cancelled");
				return;
			}
			const message = error instanceof Error ? error.message : "Try again";
			paymentStatus.fail(message);
			toast.error("Payment failed", { description: message });
		},
	});

	async function submit(event: FormEvent) {
		event.preventDefault();
		setSuccess(false);
		mutation.mutate();
	}

	return (
		<Card>
			<div className="mb-5 flex items-start justify-between gap-4">
				<div>
					<h2 className="text-lg font-bold">Payments</h2>
					<p className="text-sm text-white/48">Send to a username or pay many people at once.</p>
				</div>
				{success ? <CheckCircle2 className="text-accent" /> : <Send className="text-white/54" />}
			</div>

			{!lockedRecipient && (
				<div className="mb-4 flex items-center justify-between rounded-[8px] border border-white/10 bg-white/[0.04] p-1">
					{[
						["single", "Send"],
						["batch", "Batch"],
					].map(([key, label]) => (
						<button
							key={key}
							type="button"
							onClick={() => setMode(key as typeof mode)}
							className={mode === key ? "w-full rounded-[6px] bg-accent px-3 py-2 text-sm font-bold text-black" : "w-full rounded-[6px] px-3 py-2 text-sm font-semibold text-white/56"}
						>
							{label}
						</button>
					))}
				</div>
			)}

			<form onSubmit={submit} className="space-y-3">
				{mode === "batch" ? (
					<BatchPayments rows={batchRows} onChange={setBatchRows} />
				) : (
					<>
						<UsernameSelector value={recipient} onChange={setRecipient} initialUsername={normalizedInitialRecipient} locked={Boolean(lockedRecipient)} />
						<Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Amount in KTA" />
						<Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="What's it for?" />
					</>
				)}

				<Button className="w-full" loading={mutation.isPending} disabled={mode === "single" && !canSendSingle}>
					{mutation.isPending ? "Sending..." : mode === "batch" ? "Send batch" : "Send KTA"}
				</Button>
			</form>

			{success && (
				<motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 rounded-[8px] bg-accent/12 p-3 text-sm text-accent">
					Payment confirmed and added to the live feed.
				</motion.div>
			)}
		</Card>
	);
}

function UsernameSelector({ value, onChange, initialUsername, locked = false }: { value?: SelectedUser; onChange: (user?: SelectedUser) => void; initialUsername?: string | null; locked?: boolean }) {
	const [query, setQuery] = useState(value?.username ? `@${value.username}` : initialUsername ? `@${initialUsername}` : "");
	const [suggestions, setSuggestions] = useState<ApiUser[]>([]);
	const [checking, setChecking] = useState(false);
	const [notFound, setNotFound] = useState(false);
	const [clearedByUser, setClearedByUser] = useState(false);

	useEffect(() => {
		if (value) setQuery(`@${value.username}`);
	}, [value]);

	useEffect(() => {
		if (!value && initialUsername && !clearedByUser) setQuery(`@${initialUsername}`);
	}, [initialUsername, value, clearedByUser]);

	useEffect(() => {
		if (locked || value) return;
		const normalized = query.replace("@", "").toLowerCase().trim();
		if (!normalized) {
			setSuggestions([]);
			setNotFound(false);
			return;
		}

		setChecking(true);
		const id = setTimeout(async () => {
			try {
				const [matches, exact] = await Promise.all([api.searchUsers(normalized), normalized.length >= 3 ? api.publicUser(normalized).catch(() => null) : Promise.resolve(null)]);
				setSuggestions(matches.slice(0, 3));
				setNotFound(normalized.length >= 3 && !exact);
				if (exact) onChange(exact);
			} finally {
				setChecking(false);
			}
		}, 380);
		return () => clearTimeout(id);
	}, [locked, onChange, query, value]);

	if (value) {
		return (
			<div className="flex items-center justify-between rounded-[8px] border border-accent/25 bg-accent/10 p-2">
				<div className="flex min-w-0 items-center gap-3">
					<Avatar src={value.profileImage} username={value.username} size="sm" />
					<div className="min-w-0">
						<p className="truncate text-sm font-bold text-white">@{value.username}</p>
						<p className="text-xs text-accent">Recipient resolved</p>
					</div>
				</div>
				{!locked && (
					<button
						type="button"
						aria-label="Clear username"
						className="grid h-8 w-8 place-items-center rounded-[8px] bg-white/10 text-white/70 hover:bg-white/15"
						onClick={() => {
							setQuery("");
							setSuggestions([]);
							setNotFound(false);
							setClearedByUser(true);
							onChange(undefined);
						}}
					>
						<X size={16} />
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<Input
				value={query}
				onChange={(e) => {
					setClearedByUser(false);
					setQuery(e.target.value.toLowerCase());
				}}
				placeholder="@username"
			/>
			{checking ? <Skeleton className="h-4 w-44" /> : notFound ? <p className="text-sm text-coral">That username does not exist.</p> : null}
			{suggestions.length > 0 && (
				<div className="grid gap-2">
					{suggestions.map((user) => (
						<button
							key={user.id}
							type="button"
							onClick={() => onChange(user)}
							className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] p-2 text-left hover:bg-white/[0.08]"
						>
							<Avatar src={user.profileImage} username={user.username} size="sm" />
							<span className="text-sm font-bold">@{user.username}</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

function BatchPayments({ rows, onChange }: { rows: BatchPaymentRow[]; onChange: (rows: BatchPaymentRow[]) => void }) {
	const validCount = useMemo(() => rows.filter((row) => row.recipient?.username && row.amount).length, [rows]);

	return (
		<div className="space-y-3">
			{rows.map((row, index) => (
				<div key={row.id} className="rounded-[8px] border border-white/10 bg-white/[0.035] p-3">
					<div className="mb-3 flex items-center justify-between">
						<p className="text-sm font-bold text-white/75">Recipient {index + 1}</p>
						{rows.length > 1 && (
							<button type="button" className="text-xs text-white/42 hover:text-white" onClick={() => onChange(rows.filter((item) => item.id !== row.id))}>
								Remove
							</button>
						)}
					</div>
					<UsernameSelector value={row.recipient} onChange={(recipient) => onChange(rows.map((item) => (item.id === row.id ? { ...item, recipient } : item)))} />
					<div className="mt-3 grid gap-3 sm:grid-cols-2">
						<Input value={row.amount} onChange={(e) => onChange(rows.map((item) => (item.id === row.id ? { ...item, amount: e.target.value } : item)))} placeholder="Amount" />
						<Input value={row.message} onChange={(e) => onChange(rows.map((item) => (item.id === row.id ? { ...item, message: e.target.value } : item)))} placeholder="Message" />
					</div>
				</div>
			))}
			<div className="flex items-center justify-between">
				<p className="text-sm text-white/45">{validCount} ready to send</p>
				<button
					type="button"
					className="inline-flex items-center gap-2 rounded-[8px] border border-white/10 px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10"
					onClick={() => onChange([...rows, { id: crypto.randomUUID(), amount: "", message: "" }])}
				>
					<Plus size={16} /> Add user
				</button>
			</div>
		</div>
	);
}
