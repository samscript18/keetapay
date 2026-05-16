import { ActivityCard } from "@/components/common/activity-card";
import type { ApiTransaction } from "@/types/api";

export function ActivityList({
	transactions,
	currentUsername,
	emptyMessage = "No transactions yet. Send the first one.",
	showDescription = true,
}: {
	transactions: ApiTransaction[];
	currentUsername?: string;
	emptyMessage?: string;
	showDescription?: boolean;
}) {
	if (!transactions.length) return <p className="text-sm text-white/45">{emptyMessage}</p>;

	return (
		<div className="grid md:grid-cols-2 gap-4">
			{transactions.map((tx) => (
				<ActivityCard key={tx._id} transaction={tx} currentUsername={currentUsername} />
			))}
		</div>
	);
}
