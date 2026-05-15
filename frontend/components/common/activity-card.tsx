import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { ApiTransaction } from "@/types/api";
import { shortBlockHash } from "@/lib/utils";

export function ActivityCard({
  transaction,
  currentUsername,
}: {
  transaction: ApiTransaction;
  currentUsername?: string;
}) {
  const sender = transaction.fromUserId;
  const recipient = transaction.toUserId;
  const incoming = currentUsername
    ? recipient?.username === currentUsername
    : false;
  const accent = incoming ? "text-accent" : "text-sky";
  const Icon = incoming ? ArrowDownLeft : ArrowUpRight;
  const blockHash = transaction.blockHash ?? transaction.txHash;

  return (
    <article className="group relative overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045] p-4 transition hover:border-accent/35 hover:bg-white/[0.07]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/45 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar
            username={sender?.username}
            src={sender?.profileImage}
            size="sm"
          />
          <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-[#10141b] bg-[#18202a]">
            <Icon size={12} className={accent} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <UsernamePill username={sender?.username} />
            <span className="text-white/42">paid</span>
            <UsernamePill username={recipient?.username} variant="sky" />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-[8px] bg-accent/12 px-2 py-1 text-sm font-black text-accent">
              {transaction.amount} KTA
            </span>
            <span className="text-xs text-white/38">
              {formatDate(transaction.createdAt)}
            </span>
          </div>

          <div className="mt-3 flex items-start gap-2 rounded-[8px] border border-white/10 bg-black/15 p-3">
            <MessageSquare
              size={14}
              className="mt-0.5 shrink-0 text-white/34"
            />
            <p className="min-w-0 flex-1 truncate text-xs leading-5 text-white/58">
              {transaction.message || shortBlockHash(blockHash)}
            </p>
            <a
              href={`https://explorer.test.keeta.com/block/${blockHash}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Open transaction"
              className="text-white/32 hover:text-accent"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

function UsernamePill({
  username,
  variant = "accent",
}: {
  username?: string;
  variant?: "accent" | "sky";
}) {
  return (
    <span
      className={
        variant === "accent"
          ? "rounded-full bg-accent/15 px-2 py-1 font-bold text-accent"
          : "rounded-full bg-sky/15 px-2 py-1 font-bold text-sky"
      }
    >
      @{username ?? "unknown"}
    </span>
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
