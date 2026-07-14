const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const supportedLocales = new Set(["en", "pt-BR", "zh-CN", "fr"]);

function selectedLocale() {
  if (typeof document === "undefined") return "en";
  const value = document.cookie
    .split("; ")
    .find((item) => item.startsWith("KEETAPAY_LOCALE="))
    ?.slice("KEETAPAY_LOCALE=".length);

  if (!value) return "en";
  try {
    const locale = decodeURIComponent(value);
    return supportedLocales.has(locale) ? locale : "en";
  } catch {
    return "en";
  }
}

async function localizeError(message: string, token?: string) {
  const targetLanguage = selectedLocale();
  if (!token || targetLanguage === "en") return message;
  try {
    const response = await fetch(`${API_URL}/localization/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ text: message, targetLanguage }),
      cache: "no-store",
    });
    if (!response.ok) return message;
    const payload = (await response.json()) as { translated?: string };
    return payload.translated?.trim() || message;
  } catch {
    return message;
  }
}

import type {
  ApiIdentityProof,
  ApiPaymentRequest,
  ApiTransaction,
  ApiUser,
  CreatePaymentRequestBody,
  SendPaymentBody,
  WithdrawPaymentBody,
} from "@/types/api";

export type { ApiPaymentRequest, ApiTransaction, ApiUser } from "@/types/api";

async function request<T>(
  path: string,
  token?: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    const message = typeof payload.message === "string" ? payload.message : "Request failed";
    throw new Error(await localizeError(message, token));
  }
  return res.json();
}

async function upload<T>(
  path: string,
  token: string,
  formData: FormData,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.message ?? "Upload failed");
  }
  return res.json();
}

export const api = {
  sync: (token: string) =>
    request<{ user: ApiUser; needsUsername: boolean }>("/auth/sync", token, {
      method: "POST",
    }),
  me: (token: string) => request<ApiUser>("/auth/me", token),
  createProfile: (token: string, username: string) =>
    request<ApiUser>("/auth/profile", token, {
      method: "POST",
      body: JSON.stringify({ username }),
    }),
  updateSettings: (
    token: string,
    data: Partial<Pick<ApiUser, "username" | "bio">>,
  ) =>
    request<ApiUser>("/users/me/settings", token, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  uploadAvatar: (token: string, file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return upload<ApiUser>("/users/me/avatar", token, formData);
  },
  availability: (username: string) =>
    request<{ username: string; available: boolean }>(
      `/users/availability?username=${username}`,
    ),
  searchUsers: (query: string) =>
    request<ApiUser[]>(`/users/search?q=${encodeURIComponent(query)}`),
  publicUser: (username: string) => request<ApiUser>(`/users/${username}`),
  send: (token: string, body: SendPaymentBody, signal?: AbortSignal) =>
    request<{ transaction: ApiTransaction; explorerUrl?: string }>(
      "/payments/send",
      token,
      { method: "POST", body: JSON.stringify(body), signal },
    ),
  withdraw: (token: string, body: WithdrawPaymentBody, signal?: AbortSignal) =>
    request<{ transaction: ApiTransaction; explorerUrl: string }>(
      "/payments/withdraw",
      token,
      { method: "POST", body: JSON.stringify(body), signal },
    ),
  sendMany: (
    token: string,
    body: { payments: SendPaymentBody[] },
    signal?: AbortSignal,
  ) =>
    request<{
      results: Array<{ transaction: ApiTransaction; explorerUrl: string }>;
    }>("/payments/send-many", token, {
      method: "POST",
      body: JSON.stringify(body),
      signal,
    }),
  createPaymentRequest: (token: string, body: CreatePaymentRequestBody) =>
    request<ApiPaymentRequest>("/payment-requests", token, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  paymentRequests: (token: string) =>
    request<ApiPaymentRequest[]>("/payment-requests/me", token),
  paymentRequest: (code: string) =>
    request<ApiPaymentRequest>(`/payment-requests/${code}`),
  history: (token: string) =>
    request<ApiTransaction[]>("/transactions/me", token),
  publicHistory: (username: string) =>
    request<ApiTransaction[]>(`/transactions/user/${username}`),
  feed: () => request<ApiTransaction[]>("/feed/live?limit=40"),
  verifyIdentityCertificate: (certificate: unknown) =>
    request<ApiIdentityProof>("/identity/verify-certificate", undefined, {
      method: "POST",
      body: JSON.stringify(certificate),
    }),
  requestSelectiveDisclosure: () =>
    request<{ unsupportedReason: string }>(
      "/identity/request-selective-disclosure",
      undefined,
      { method: "POST" },
    ),
  verifyDisclosure: (disclosure: unknown) =>
    request<{ valid: boolean; unsupportedReason?: string }>(
      "/identity/verify-disclosure",
      undefined,
      { method: "POST", body: JSON.stringify(disclosure) },
    ),
  balance: (token: string) =>
    request<{ balance: string; symbol: string }>("/wallet/balance", token),
};
