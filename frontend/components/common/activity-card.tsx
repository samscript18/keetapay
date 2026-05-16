import { ArrowDownLeft, ArrowUpRight, ExternalLink, MessageSquare, Shield } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import UsernamePill from "@/components/shared/username-pill";
import type { ApiTransaction } from "@/types/api";
import { shortAddress, shortBlockHash } from "@/lib/utils";

export function ActivityCard({ transaction, currentUsername }: { transaction: ApiTransaction; currentUsername?: string }) {
	const sender = transaction.fromUserId;
	const recipient = transaction.toUserId;
	const incoming = currentUsername ? recipient?.username === currentUsername : false;
	const senderView = currentUsername ? sender?.username === currentUsername : false;
	const privateTx = Boolean(transaction.isPrivate);
	const shielded = privateTx && !senderView;
	const accent = incoming ? "text-accent" : "text-red-600";
	const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
	const blockHash = transaction.blockHash ?? transaction.txHash;
	const recipientLabel = recipient?.username ? `@${recipient.username}` : shortAddress(transaction.toWalletAddress);
	const note = shielded ? "Shielded" : transaction.message || blockHash;
	const mobileNote = shielded ? "Shielded" : transaction.message || shortBlockHash(blockHash);

	return (
		<article className="group relative overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045] p-4 transition hover:border-accent/35 hover:bg-white/[0.07]">
			<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent opacity-0 transition group-hover:opacity-100" />
			{privateTx && (
				<span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-accent/20 bg-[#14241f] px-2 py-1 text-[10px] md:text-xs font-bold text-accent animate-pulse">
					<Shield size={12} /> <span className="max-md:hidden">Private</span>
				</span>
			)}
			<div className="flex items-start gap-3">
				<div className="relative shrink-0">
					<Avatar username={sender?.username} src={incoming ? recipient?.profileImage : sender?.profileImage} size="sm" />
					{currentUsername && (
						<span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-[#10141b] bg-[#18202a]">
							<Icon size={12} className={accent} />
						</span>
					)}
				</div>

				<div className="min-w-0 flex-1">
					<div className="flex flex-wrap items-center gap-2 text-sm">
						<UsernamePill username={sender?.username} proof={transaction.senderIdentityProof} />
						<span className="text-white/42">sent</span>
						<UsernamePill username={recipientLabel} variant="sky" raw />
					</div>

					<div className="mt-3 flex flex-wrap items-center gap-2">
						<span className="rounded-[8px] bg-accent/12 px-2 py-1 text-sm font-black text-accent">{shielded ? "Shielded KTA" : `${transaction.amount} KTA`}</span>
						<span className="text-xs text-white/38">{formatDate(transaction.createdAt)}</span>
					</div>

					<div className="mt-3 flex items-start gap-2 rounded-[8px] border border-white/10 bg-black/15 p-3">
						<MessageSquare size={14} className="mt-0.5 shrink-0 text-white/34" />
						<p className="min-w-0 flex-1 truncate text-xs leading-5 text-white/58 max-md:hidden">{note}</p>
						<p className="min-w-0 flex-1 truncate text-xs leading-5 text-white/58 md:hidden">{mobileNote}</p>
						{!privateTx && (
							<a href={`https://explorer.test.keeta.com/block/${blockHash}`} target="_blank" rel="noreferrer" aria-label="Open transaction" className="text-white/32 hover:text-accent">
								<ExternalLink size={14} />
							</a>
						)}
					</div>
				</div>
			</div>
		</article>
	);
}

function formatDate(value: string) {
	return new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(value));
}
