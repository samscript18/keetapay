"use client";

import { Fragment } from "react";
import { CheckCircle2, Loader2, OctagonAlert, Radio, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { usePaymentStatusStore } from "@/store/payment-status-store";
import type { PaymentStatus } from "@/interfaces/payment";

export function PaymentStatusModal() {
  const t = useTranslations("transferStatus");
  const { open, status, title, description, error, cancel, close } =
    usePaymentStatusStore();
  const steps: Array<{ key: PaymentStatus; label: string }> = [
    { key: "initiating", label: t("initiating") },
    { key: "processing", label: t("processing") },
    { key: "sent", label: t("sent") },
  ];

  if (!open) return null;

  const canCancel = status === "initiating" || status === "processing";
  const isTerminal =
    status === "sent" || status === "failed" || status === "cancelled";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[8px] border border-white/10 bg-[#10141b] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              {t("eyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-black">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-white/55">
              {error ?? description}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="grid h-9 w-9 place-items-center rounded-[8px] border border-white/10 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label={t("closeLabel")}
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-7">
          <div className="grid grid-cols-[1fr_52px_1fr_52px_1fr] items-start">
            {steps.map((step, index) => (
              <Fragment key={step.key}>
                <StatusNode
                  label={step.label}
                  active={status === step.key}
                  complete={stepComplete(status, index)}
                  failed={status === "failed" && step.key === "processing"}
                />
                {index < steps.length - 1 && (
                  <StatusConnector
                    complete={connectorComplete(status, index)}
                    active={connectorActive(status, index)}
                    failed={status === "failed" && index === 1}
                  />
                )}
              </Fragment>
            ))}
          </div>
          {status === "cancelled" && (
            <div className="mt-5 rounded-[8px] border border-coral/25 bg-coral/10 p-3 text-center text-sm font-bold text-coral">
              {t("cancelled")}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {canCancel ? (
            <Button variant="secondary" className="w-full" onClick={cancel}>
              {t("cancel")}
            </Button>
          ) : (
            <Button
              variant={isTerminal ? "secondary" : "ghost"}
              className="w-full"
              onClick={close}
            >
              {t("close")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusNode({
  label,
  active,
  complete,
  failed,
}: {
  label: string;
  active: boolean;
  complete: boolean;
  failed?: boolean;
}) {
  const Icon = failed
    ? OctagonAlert
    : complete
      ? CheckCircle2
      : active
        ? Loader2
        : Radio;

  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <div
        className={
          failed
            ? "grid h-12 w-12 place-items-center rounded-full border border-coral/35 bg-coral/12"
            : complete
              ? "grid h-12 w-12 place-items-center rounded-full border border-accent/35 bg-accent/12"
              : active
                ? "grid h-12 w-12 place-items-center rounded-full border border-sky/35 bg-sky/12"
                : "grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04]"
        }
      >
        <Icon
          size={19}
          className={
            failed
              ? "text-coral"
              : complete
                ? "text-accent"
                : active
                  ? "animate-spin text-sky"
                  : "text-white/30"
          }
        />
      </div>
      <span
        className={
          failed
            ? "text-sm font-bold text-coral"
            : complete || active
              ? "text-sm font-bold text-white"
              : "text-sm font-semibold text-white/42"
        }
      >
        {label}
      </span>
    </div>
  );
}

function StatusConnector({
  complete,
  active,
  failed,
}: {
  complete: boolean;
  active: boolean;
  failed: boolean;
}) {
  return (
    <div className="relative mt-6 h-1 overflow-hidden rounded-full bg-white/10">
      <div
        className={
          failed
            ? "h-full w-full bg-coral"
            : complete
              ? "h-full w-full bg-accent"
              : active
                ? "h-full w-1/2 animate-pulse rounded-full bg-sky"
                : "h-full w-0 bg-white/10"
        }
      />
    </div>
  );
}

function stepComplete(status: PaymentStatus, index: number) {
  if (status === "sent") return true;
  if (status === "processing") return index === 0;
  return false;
}

function connectorComplete(status: PaymentStatus, index: number) {
  if (status === "sent") return true;
  return status === "processing" && index === 0;
}

function connectorActive(status: PaymentStatus, index: number) {
  if (status === "initiating") return index === 0;
  if (status === "processing") return index === 1;
  return false;
}
