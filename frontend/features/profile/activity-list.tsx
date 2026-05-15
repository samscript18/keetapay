import { ActivityCard } from "@/components/common/activity-card";
import type { ApiTransaction } from "@/types/api";

export function ActivityList({
  transactions,
  currentUsername,
}: {
  transactions: ApiTransaction[];
  currentUsername?: string;
}) {
  if (!transactions.length)
    return (
      <p className="text-sm text-white/45">
        No transactions yet. Send the first one.
      </p>
    );

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <ActivityCard
          key={tx._id}
          transaction={tx}
          currentUsername={currentUsername}
        />
      ))}
    </div>
  );
}
