import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import * as KeetaNet from "@keetanetwork/keetanet-client";
import { Model } from "mongoose";
import { WalletsService } from "../wallets/wallets.service";
import {
  IdentityAttributes,
  IdentityCertificate,
  IdentityProof,
} from "./identity.types";
import { IdentityRecord } from "./schemas/identity-record.schema";

const NOT_SUPPORTED = "Not supported by Keeta SDK" as const;

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    @InjectModel(IdentityRecord.name)
    private readonly identityModel: Model<IdentityRecord>,
    private readonly config: ConfigService,
    private readonly walletsService: WalletsService,
  ) {}

  async issueCertificate(
    encryptedSeed: string,
    _attributes: IdentityAttributes = {},
  ) {
    const account = this.walletsService.accountFromEncryptedSeed(encryptedSeed);
    const walletAddress = account.publicKeyString?.toString();
    const existing = await this.identityModel.findOne({ walletAddress }).lean();
    if (existing?.certificate?.verificationSource === "keeta-sdk") {
      return this.verifyCertificate(existing.certificate);
    }

    const certificate = await this.createCertificate(account);
    await this.anchorCertificate(account, certificate);

    const sdkState = this.toIdentityCertificate(walletAddress, certificate);
    await this.identityModel.findOneAndUpdate(
      { walletAddress },
      { walletAddress, certificate: sdkState },
      { upsert: true, new: true },
    );

    return sdkState;
  }

  async certificateForWallet(walletAddress: string) {
    const record = await this.identityModel.findOne({ walletAddress }).lean();
    if (!record?.certificate) {
      return this.unsupportedCertificate(walletAddress);
    }
    return this.verifyCertificate(record.certificate);
  }

  async createCertificate(account: ReturnType<typeof KeetaNet.lib.Account.fromSeed>) {
    const now = new Date();
    const validTo = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);

    return new KeetaNet.lib.Utils.Certificate.CertificateBuilder({
      subjectPublicKey: account as any,
      issuer: account as any,
      subjectDN: [{ name: "commonName", value: account.publicKeyString?.toString() ?? "" }],
      issuerDN: [{ name: "commonName", value: account.publicKeyString?.toString() ?? "" }],
      validFrom: now,
      validTo,
      serial: BigInt(Date.now()),
      hashParams: {
        functions: {
          "sha3-256": (data: Buffer) => KeetaNet.lib.Utils.Hash.Hash(data),
        },
        defaults: {
          signature: "sha3-256",
          ski: "sha3-256",
          aki: "sha3-256",
        },
      },
    }).build();
  }

  verifyCertificate(certificateState?: IdentityCertificate) {
    if (!certificateState?.certificate) {
      return this.unsupportedCertificate(certificateState?.walletAddress);
    }

    try {
      const certificate = new KeetaNet.lib.Utils.Certificate.Certificate(
        certificateState.certificate as any,
      );
      const verified =
        certificate.verify(certificate.subjectPublicKey) &&
        certificate.checkValid(new Date());

      return {
        ...certificateState,
        issuer: certificate.issuer,
        certificateHash: certificate.hash().toString(),
        subjectPublicKey: certificate.subjectPublicKey.toString(),
        expiresAt: certificate.notAfter.toISOString(),
        verified,
        verificationSource: "keeta-sdk" as const,
        unsupportedReason: undefined,
      };
    } catch (error) {
      this.logger.warn(
        `Keeta SDK certificate verification failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return {
        ...certificateState,
        verified: false,
        verificationSource: "keeta-sdk" as const,
      };
    }
  }

  requestSelectiveDisclosure(): IdentityProof {
    return { unsupportedReason: NOT_SUPPORTED };
  }

  verifyDisclosure() {
    return {
      valid: false,
      attributes: {},
      unsupportedReason: NOT_SUPPORTED,
    };
  }

  private async anchorCertificate(
    account: ReturnType<typeof KeetaNet.lib.Account.fromSeed>,
    certificate: Awaited<ReturnType<IdentityService["createCertificate"]>>,
  ) {
    if (this.config.get<string>("KEETA_DEMO_MODE") === "true") return;

    const client = KeetaNet.UserClient.fromNetwork(
      this.keetaNetwork(),
      account as any,
    );
    try {
      await client.modifyCertificate(
        KeetaNet.lib.Block.AdjustMethod.ADD,
        certificate as any,
        null,
      );
    } finally {
      await client.destroy?.();
    }
  }

  private toIdentityCertificate(
    walletAddress: string | undefined,
    certificate: Awaited<ReturnType<IdentityService["createCertificate"]>>,
  ): IdentityCertificate {
    const json = certificate.toJSON();
    return {
      walletAddress: walletAddress ?? certificate.subjectPublicKey.toString(),
      subjectPublicKey: certificate.subjectPublicKey.toString(),
      issuer: certificate.issuer,
      certificateHash: certificate.hash().toString(),
      certificate: json,
      issuedAt: certificate.notBefore.toISOString(),
      expiresAt: certificate.notAfter.toISOString(),
      verified:
        certificate.verify(certificate.subjectPublicKey) &&
        certificate.checkValid(new Date()),
      verificationSource: "keeta-sdk",
    };
  }

  private unsupportedCertificate(walletAddress?: string): IdentityCertificate {
    return {
      walletAddress: walletAddress ?? "",
      subjectPublicKey: "",
      issuer: "",
      certificateHash: "",
      certificate: null,
      issuedAt: "",
      verified: false,
      verificationSource: "keeta-sdk",
      unsupportedReason: NOT_SUPPORTED,
    };
  }

  private keetaNetwork() {
    const network = this.config.get<string>("KEETA_NETWORK") ?? "test";
    if (["main", "staging", "test", "dev"].includes(network)) {
      return network as "main" | "staging" | "test" | "dev";
    }
    return "test";
  }
}
