import { BadgeCheck, ShieldCheck } from "lucide-react";
import type { ApiIdentityProof } from "@/types/api";

export function IdentityBadges({ proof, compact = false }: { proof?: ApiIdentityProof; compact?: boolean }) {
	const verified = proof?.verificationSource === "keeta-sdk" && Boolean(proof.verified);

	if (!verified) {
		return compact ? null : (
			<span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/42" aria-label="Account not verified">
				<ShieldCheck size={12} />
			</span>
		);
	}

	if (compact) {
		return (
			<span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent" aria-label="Verified account">
				<BadgeCheck size={12} />
			</span>
		);
	}

	return (
		<div className="flex flex-wrap gap-2">
			<span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent" aria-label="Verified account">
				<BadgeCheck size={14} />
			</span>
		</div>
	);
}
