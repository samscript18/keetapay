const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

import type {
  ApiPaymentRequest,
  ApiTransaction,
  ApiUser,
  CreatePaymentRequestBody,
  SendPaymentBody,
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
    throw new Error(payload.message ?? "Request failed");
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
    request<{ transaction: ApiTransaction; explorerUrl: string }>(
      "/payments/send",
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
  balance: (token: string) =>
    request<{ balance: string; symbol: string }>("/wallet/balance", token),
};
