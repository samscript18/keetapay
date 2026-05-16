import { BadgeCheck } from "lucide-react";
import type { ApiIdentityProof } from "@/types/api";

function UsernamePill({
	username,
	variant = "accent",
	proof,
	raw = false,
	size = "sm",
}: {
	username?: string;
	variant?: "accent" | "sky";
	proof?: ApiIdentityProof;
	raw?: boolean;
	size?: "sm" | "lg";
}) {
	const label = username ?? "unknown";
	const verified = proof?.verificationSource === "keeta-sdk" && Boolean(proof.verified);
	const tone = variant === "accent" ? "bg-accent/15 text-accent" : "bg-sky/15 text-sky";
	const sizing = size === "lg" ? "gap-2 px-3 py-1.5 text-xl md:text-2xl" : "gap-1.5 px-2 py-1";

	return (
		<span className={`inline-flex items-center rounded-full font-bold ${tone} ${sizing}`}>
			{verified && <BadgeCheck size={size === "lg" ? 18 : 13} aria-label="Verified account" className="shrink-0" />}
			{raw ? label : `@${label}`}
		</span>
	);
}

export default UsernamePill;
