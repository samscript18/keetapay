export type ApiUser = {
  id: string;
  username?: string;
  walletAddress: string;
  profileImage?: string;
  bio?: string;
  createdAt?: string;
  identityProof?: ApiIdentityProof;
};

export type ApiIdentityAttributes = {
  kycVerified?: boolean;
  isMerchant?: boolean;
  isHuman?: boolean;
};

export type ApiIdentityProof = {
  walletAddress: string;
  subjectPublicKey: string;
  issuer: string;
  certificateHash: string;
  certificate?: unknown;
  issuedAt?: string;
  expiresAt?: string;
  verified?: boolean;
  verificationSource?: "keeta-sdk";
  unsupportedReason?: string;
};

export type ApiTransaction = {
  _id: string;
  amount: string;
  message?: string;
  blockHash?: string;
  txHash: string;
  isPrivate?: boolean;
  network?: "main" | "private-subnet";
  toWalletAddress?: string;
  senderIdentityProof?: ApiIdentityProof;
  recipientIdentityProof?: ApiIdentityProof;
  createdAt: string;
  fromUserId: ApiUser;
  toUserId?: ApiUser;
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
  recipientIdentityProof?: ApiIdentityProof;
};

export type SendPaymentBody = {
  recipient: string;
  amount: string;
  message?: string;
  privateMode?: boolean;
};

export type WithdrawPaymentBody = {
  walletAddress: string;
  amount: string;
  message?: string;
};

export type CreatePaymentRequestBody = {
  amount: string;
  message?: string;
  expiresIn?: "15m" | "1h" | "24h" | "7d";
};

export type TransactionFilter = "all" | "sent" | "received";
