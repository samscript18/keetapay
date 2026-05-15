import { create } from "zustand";
import type { PaymentStatus } from "@/interfaces/payment";

type PaymentStatusState = {
  open: boolean;
  status: PaymentStatus;
  title: string;
  description: string;
  error?: string;
  controller?: AbortController;
  start: (controller: AbortController, description?: string) => void;
  setStatus: (status: PaymentStatus, description?: string) => void;
  fail: (error: string) => void;
  cancel: () => void;
  close: () => void;
};

export const usePaymentStatusStore = create<PaymentStatusState>((set, get) => ({
  open: false,
  status: "idle",
  title: "Payment",
  description: "",
  start: (controller, description = "Preparing your KTA transfer.") =>
    set({
      open: true,
      status: "initiating",
      title: "Sending KTA",
      description,
      error: undefined,
      controller,
    }),
  setStatus: (status, description) =>
    set((state) => ({
      status,
      description: description ?? state.description,
      error: status === "failed" ? state.error : undefined,
    })),
  fail: (error) =>
    set({
      open: true,
      status: "failed",
      title: "Payment failed",
      description: "The transfer could not be completed.",
      error,
      controller: undefined,
    }),
  cancel: () => {
    get().controller?.abort();
    set({
      status: "cancelled",
      title: "Payment cancelled",
      description: "The transfer request was cancelled.",
      controller: undefined,
    });
  },
  close: () =>
    set({
      open: false,
      status: "idle",
      title: "Payment",
      description: "",
      error: undefined,
      controller: undefined,
    }),
}));
