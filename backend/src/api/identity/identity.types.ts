export type IdentityAttributes = {
  kycVerified?: boolean;
  isMerchant?: boolean;
  isHuman?: boolean;
};

export type IdentityCertificate = {
  walletAddress: string;
  subjectPublicKey: string;
  issuer: string;
  certificateHash: string;
  certificate: unknown;
  issuedAt: string;
  expiresAt?: string;
  verified: boolean;
  verificationSource: "keeta-sdk";
  unsupportedReason?: string;
};

export type IdentityProof = {
  unsupportedReason: "Not supported by Keeta SDK";
};

export type VerifiedIdentityProof = {
  valid: boolean;
  attributes?: IdentityAttributes;
  walletAddress?: string;
  issuer?: string;
  verificationSource?: "keeta-sdk";
  unsupportedReason?: "Not supported by Keeta SDK";
};
