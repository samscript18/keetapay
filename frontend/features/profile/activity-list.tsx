import { ActivityCard } from "@/components/common/activity-card";
import type { ApiTransaction } from "@/types/api";
import { useTranslations } from "next-intl";

export function ActivityList({
	transactions,
	currentUsername,
	emptyMessage,
	showDescription = true,
}: {
	transactions: ApiTransaction[];
	currentUsername?: string;
	emptyMessage?: string;
	showDescription?: boolean;
}) {
	const t = useTranslations("activity");
	if (!transactions.length) return <p className="text-sm text-white/45">{emptyMessage ?? t("empty")}</p>;

	return (
		<div className="grid md:grid-cols-2 gap-4">
			{transactions.map((tx) => (
				<ActivityCard key={tx._id} transaction={tx} currentUsername={currentUsername} />
			))}
		</div>
	);
}
