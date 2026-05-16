import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { randomBytes } from "crypto";
import { Model, Types } from "mongoose";
import { IdentityService } from "../identity/identity.service";
import { UsersService } from "../users/users.service";
import { WalletsService } from "../wallets/wallets.service";
import { CreatePaymentRequestDto } from "./dto/create-payment-request.dto";
import { SendPaymentDto } from "./dto/send-payment.dto";
import { SendManyPaymentsDto } from "./dto/send-many-payments.dto";
import { WithdrawPaymentDto } from "./dto/withdraw-payment.dto";
import { PaymentRequest } from "./schemas/payment-request.schema";
import { Transaction } from "./schemas/transaction.schema";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Transaction.name) private readonly txModel: Model<Transaction>,
    @InjectModel(PaymentRequest.name)
    private readonly requestModel: Model<PaymentRequest>,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
    private readonly identityService: IdentityService,
    private readonly config: ConfigService,
  ) {}

  async send(privyUserId: string, dto: SendPaymentDto) {
    return this.sendOne(privyUserId, dto);
  }

  async sendMany(privyUserId: string, dto: SendManyPaymentsDto) {
    const results = [];
    for (const payment of dto.payments) {
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        try {
          const result = await this.sendOne(privyUserId, payment);
          results.push(result);
          break;
        } catch (error) {
          attempts++;
          const message = error instanceof Error ? error.message : "";

          const isSequenceError =
            message.includes("existing vote for a successor") ||
            message.includes("LEDGER_SUCCESSOR_VOTE_EXISTS");

          if (isSequenceError && attempts < maxAttempts) {
            this.logger.warn(
              `Sequence race condition met during batch processing. Retrying attempt ${attempts}...`,
            );
            await new Promise((resolve) => setTimeout(resolve, 800));
          } else {
            throw new BadRequestException(
              `Failed to process payment to ${payment.recipient} after ${attempts} attempts: ${message}`,
            );
          }
        }
      }
    }
    return { results };
  }

  async createPaymentRequest(
    privyUserId: string,
    dto: CreatePaymentRequestDto,
  ) {
    const recipient =
      await this.usersService.findRawByPrivyUserIdOrThrow(privyUserId);
    if (!recipient.username)
      throw new BadRequestException(
        "Choose a username before creating payment links",
      );

    const request = await this.requestModel.create({
      code: randomBytes(9).toString("base64url"),
      recipientUserId: recipient._id,
      amount: dto.amount,
      message: dto.message ?? "",
      expiresAt: this.expiresAt(dto.expiresIn ?? "1h"),
      recipientIdentityProof: await this.identityService.certificateForWallet(
        recipient.walletAddress,
      ),
    });

    return this.hydratePaymentRequest(request.code);
  }

  async getPaymentRequest(code: string) {
    const request = await this.hydratePaymentRequest(code);
    if (!request) throw new BadRequestException("Payment link was not found");
    return this.withPaymentRequestStatus(request);
  }

  async paymentRequestsForUser(privyUserId: string) {
    const user =
      await this.usersService.findRawByPrivyUserIdOrThrow(privyUserId);
    const requests = await this.requestModel
      .find({ recipientUserId: user._id })
      .sort({ createdAt: -1 })
      .populate("recipientUserId", "username profileImage walletAddress bio")
      .lean();

    return requests.map((request) => this.withPaymentRequestStatus(request));
  }

  async withdraw(privyUserId: string, dto: WithdrawPaymentDto) {
    const sender =
      await this.usersService.findRawByPrivyUserIdOrThrow(privyUserId);

    if (!sender.username)
      throw new BadRequestException(
        "Choose a username before withdrawing KTA",
      );

    const blockHash = await this.transferOrThrow(
      sender.encryptedSeed,
      dto.walletAddress,
      dto.amount,
    );

    const tx = await this.txModel.create({
      fromUserId: sender._id,
      toWalletAddress: dto.walletAddress,
      amount: dto.amount,
      message: dto.message ?? "",
      blockHash,
      txHash: blockHash,
      isPrivate: false,
      network: "main",
      senderIdentityProof: await this.identityService.certificateForWallet(
        sender.walletAddress,
      ),
    });

    return {
      transaction: await this.hydrateTransaction(tx._id),
      explorerUrl: this.blockExplorerUrl(blockHash),
    };
  }

  private async sendOne(privyUserId: string, dto: SendPaymentDto) {
    const sender =
      await this.usersService.findRawByPrivyUserIdOrThrow(privyUserId);
    const recipient = await this.usersService.findByUsernameOrThrow(
      dto.recipient,
    );

    if (!sender.username)
      throw new BadRequestException(
        "Choose a username before sending payments",
      );
    if (String(sender._id) === String(recipient._id))
      throw new BadRequestException("You cannot pay yourself");

    const blockHash = await this.transferOrThrow(
      sender.encryptedSeed,
      recipient.walletAddress,
      dto.amount,
    );

    const tx = await this.txModel.create({
      fromUserId: sender._id,
      toUserId: recipient._id,
      toWalletAddress: recipient.walletAddress,
      amount: dto.amount,
      message: dto.message ?? "",
      blockHash,
      txHash: blockHash,
      isPrivate: Boolean(dto.privateMode),
      network: dto.privateMode ? "private-subnet" : "main",
      senderIdentityProof: await this.identityService.certificateForWallet(
        sender.walletAddress,
      ),
      recipientIdentityProof: await this.identityService.certificateForWallet(
        recipient.walletAddress,
      ),
    });

    return {
      transaction: await this.hydrateTransaction(tx._id),
      explorerUrl: dto.privateMode ? undefined : this.blockExplorerUrl(blockHash),
    };
  }

  async historyForUser(privyUserId: string) {
    const user =
      await this.usersService.findRawByPrivyUserIdOrThrow(privyUserId);
    return this.txModel
      .find({ $or: [{ fromUserId: user._id }, { toUserId: user._id }] })
      .sort({ createdAt: -1 })
      .limit(40)
      .populate("fromUserId", "username profileImage walletAddress")
      .populate("toUserId", "username profileImage walletAddress")
      .lean();
  }

  async publicHistory(username: string) {
    const user = await this.usersService.findByUsernameOrThrow(username);
    return this.txModel
      .find({
        isPrivate: { $ne: true },
        $or: [{ fromUserId: user._id }, { toUserId: user._id }],
      })
      .sort({ createdAt: -1 })
      .limit(30)
      .populate("fromUserId", "username profileImage")
      .populate("toUserId", "username profileImage")
      .lean();
  }

  async liveFeed(limit = 30) {
    return this.txModel
      .find({ isPrivate: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("fromUserId", "username profileImage")
      .populate("toUserId", "username profileImage")
      .lean();
  }

  private async hydrateTransaction(id: Types.ObjectId) {
    return this.txModel
      .findById(id)
      .populate("fromUserId", "username profileImage walletAddress")
      .populate("toUserId", "username profileImage walletAddress")
      .lean();
  }

  private async hydratePaymentRequest(code: string) {
    return this.requestModel
      .findOne({ code })
      .populate("recipientUserId", "username profileImage walletAddress bio")
      .lean();
  }

  private withPaymentRequestStatus<T extends { expiresAt: Date | string }>(
    request: T,
  ) {
    return {
      ...request,
      expired: new Date(request.expiresAt).getTime() <= Date.now(),
    };
  }

  private expiresAt(expiresIn: "15m" | "1h" | "24h" | "7d") {
    const durations = {
      "15m": 15 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };
    return new Date(Date.now() + durations[expiresIn]);
  }

  private errorCode(error: unknown) {
    return typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  }

  private async transferOrThrow(
    encryptedSeed: string,
    walletAddress: string,
    amount: string,
  ) {
    let chain: { blockHash?: string; txHash?: string };
    try {
      chain = await this.walletsService.sendKta(
        encryptedSeed,
        walletAddress,
        amount,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const code = this.errorCode(error);
      this.logger.error(
        `Keeta transfer failed${code ? ` (${code})` : ""}: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
      if (message.includes("ASN1 data is malformed")) {
        throw new BadRequestException(
          "A Keeta representative returned an invalid vote. Please try again.",
        );
      }
      if (
        message.includes("existing vote for a successor") ||
        message.includes("LEDGER_SUCCESSOR_VOTE_EXISTS")
      ) {
        throw new BadRequestException(
          "This wallet has a pending Keeta vote. Please retry in a moment.",
        );
      }
      if (
        code === "LEDGER_INVALID_BALANCE" ||
        message.includes("Resulting balance becomes negative")
      ) {
        throw new BadRequestException(
          "Insufficient KTA balance for this transfer.",
        );
      }
      throw new InternalServerErrorException(
        "Keeta transfer failed. Please try again.",
      );
    }

    const blockHash = chain.blockHash ?? chain.txHash;
    if (!blockHash)
      throw new InternalServerErrorException(
        "Keeta transfer did not return a block hash",
      );
    return blockHash;
  }

  private blockExplorerUrl(blockHash: string) {
    const configured =
      this.config.get<string>("KEETA_EXPLORER_URL") ??
      "https://explorer.test.keeta.com/block";
    const base = configured.replace(/\/tx\/?$/, "/block").replace(/\/$/, "");
    return `${base}/${blockHash}`;
  }
}
