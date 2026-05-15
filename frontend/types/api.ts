export type ApiUser = {
  id: string;
  username?: string;
  walletAddress: string;
  profileImage?: string;
  bio?: string;
  createdAt?: string;
};

export type ApiTransaction = {
  _id: string;
  amount: string;
  message?: string;
  blockHash?: string;
  txHash: string;
  createdAt: string;
  fromUserId: ApiUser;
  toUserId: ApiUser;
};

export type ApiPaymentRequest = {
  _id: string;
  code: string;
  recipientUserId: ApiUser;
  amount: string;
  message?: string;
  expiresAt: string;
  createdAt?: string;
  expired?: boolean;
};

export type SendPaymentBody = {
  recipient: string;
  amount: string;
  message?: string;
};

export type CreatePaymentRequestBody = {
  amount: string;
  message?: string;
  expiresIn?: "15m" | "1h" | "24h" | "7d";
};
