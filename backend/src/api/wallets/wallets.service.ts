import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import * as KeetaNet from "@keetanetwork/keetanet-client";

type KeetaNetwork = "main" | "staging" | "test" | "dev";

@Injectable()
export class WalletsService {
  constructor(private readonly config: ConfigService) {}

  async createWallet() {
    const seed = KeetaNet.lib.Account.generateRandomSeed({ asString: true });
    const account = KeetaNet.lib.Account.fromSeed(seed, 0);
    const walletAddress = account.publicKeyString?.toString();
    return {
      // seed,
      encryptedSeed: this.encryptSeed(seed),
      walletAddress,
    };
  }

  async getBalance(encryptedSeed: string) {
    if (this.isDemoMode()) return { balance: "250.00", symbol: "KTA" };

    const seed = this.decryptSeed(encryptedSeed);
    const account = KeetaNet.lib.Account.fromSeed(seed, 0);
    const client = KeetaNet.UserClient.fromNetwork(
      this.keetaNetwork(),
      account as any,
    );
    try {
      const balance = await client.balance(client.baseToken);
      const raw = BigInt(balance?.toString?.() ?? "0");

      const formatted = Number(raw) / 1_000_000_000;
      return { balance: formatted.toFixed(2), symbol: "KTA" };
    } finally {
      await client.destroy?.();
    }
  }

  async sendKta(
    encryptedSeed: string,
    toWalletAddress: string,
    amount: string,
  ) {
    if (!toWalletAddress)
      throw new BadRequestException("Recipient wallet is missing");

    const atomicAmount = this.toAtomicKta(amount);

    if (this.isDemoMode()) {
      return {
        blockHash: `demo_${randomBytes(16).toString("hex")}`,
      };
    }

    const seed = this.decryptSeed(encryptedSeed);
    const sender = KeetaNet.lib.Account.fromSeed(seed, 0);
    const client = KeetaNet.UserClient.fromNetwork(
      this.keetaNetwork(),
      sender as any,
    );
    const builder = client.initBuilder();
    const recipient = KeetaNet.lib.Account.fromPublicKeyString(toWalletAddress);

    try {
      builder.send(recipient, atomicAmount, client.baseToken);
      await client.computeBuilderBlocks(builder);
      const transaction = await builder.publish();

      console.log("Keeta transaction:",transaction);

      return {
        blockHash: this.extractBlockHash(transaction),
      };
    } finally {
      await client.destroy?.();
    }
  }

  encryptSeed(seed: string) {
    const key = this.encryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(seed, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}.${tag.toString("base64")}.${ciphertext.toString("base64")}`;
  }

  decryptSeed(encryptedSeed: string) {
    const key = this.encryptionKey();
    const [ivRaw, tagRaw, ciphertextRaw] = encryptedSeed.split(".");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivRaw, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(ciphertextRaw, "base64")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  }

  private encryptionKey() {
    const raw = this.config.get<string>("MASTER_ENCRYPTION_KEY");
    if (!raw)
      throw new InternalServerErrorException(
        "MASTER_ENCRYPTION_KEY is missing",
      );
    const key = Buffer.from(raw, "base64");
    if (key.length !== 32)
      throw new InternalServerErrorException(
        "MASTER_ENCRYPTION_KEY must be 32 bytes base64",
      );
    return key;
  }

  private keetaNetwork() {
    const network = this.config.get<string>("KEETA_NETWORK") ?? "test";
    if (["main", "staging", "test", "dev"].includes(network))
      return network as KeetaNetwork;
    throw new InternalServerErrorException(
      "KEETA_NETWORK must be one of main, staging, test, or dev",
    );
  }

  private isDemoMode() {
    return this.config.get<string>("KEETA_DEMO_MODE") === "true";
  }

  private toAtomicKta(amount: string) {
    const normalized = amount.trim();
    if (!/^\d+(\.\d{1,9})?$/.test(normalized)) {
      throw new BadRequestException(
        "Amount must be a positive KTA value with up to 9 decimals",
      );
    }

    const [whole, fractional = ""] = normalized.split(".");
    const atomic =
      BigInt(whole) * 1_000_000_000n + BigInt(fractional.padEnd(9, "0"));
    if (atomic <= 0n)
      throw new BadRequestException("Amount must be greater than 0");
    return atomic;
  }

  private extractBlockHash(value: unknown): string | undefined {
    const data = value as any;
    const hash =
      data?.blocks?.[0]?.hash ??
      data?.voteStaple?.blocks?.[0]?.hash ??
      data?.blockHash ??
      data?.hash;
    return hash?.toString?.() ?? hash;
  }
}
