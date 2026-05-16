import type { ApiUser } from "@/types/api";

export interface SelectedUser extends Pick<
  ApiUser,
  "username" | "profileImage" | "walletAddress" | "id" | "identityProof"
> {}

export interface BatchPaymentRow {
  id: string;
  recipient?: SelectedUser;
  amount: string;
  message: string;
}

export type PaymentStatus =
  | "idle"
  | "initiating"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled";
