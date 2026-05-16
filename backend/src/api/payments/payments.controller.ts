import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  AuthenticatedUser,
} from "../../shared/common/decorators/current-user.decorator";
import { PrivyAuthGuard } from "../../shared/common/guards/privy-auth.guard";
import { WalletsService } from "../wallets/wallets.service";
import { UsersService } from "../users/users.service";
import { SendPaymentDto } from "./dto/send-payment.dto";
import { CreatePaymentRequestDto } from "./dto/create-payment-request.dto";
import { SendManyPaymentsDto } from "./dto/send-many-payments.dto";
import { WithdrawPaymentDto } from "./dto/withdraw-payment.dto";
import { PaymentsService } from "./payments.service";

@Controller()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly usersService: UsersService,
    private readonly walletsService: WalletsService,
  ) {}

  @UseGuards(PrivyAuthGuard)
  @Post("payments/send")
  async send(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendPaymentDto,
  ) {
    return this.paymentsService.send(user.privyUserId, dto);
  }

  @UseGuards(PrivyAuthGuard)
  @Post("payments/send-many")
  async sendMany(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendManyPaymentsDto,
  ) {
    return this.paymentsService.sendMany(user.privyUserId, dto);
  }

  @UseGuards(PrivyAuthGuard)
  @Post("payments/withdraw")
  async withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: WithdrawPaymentDto,
  ) {
    return this.paymentsService.withdraw(user.privyUserId, dto);
  }

  @UseGuards(PrivyAuthGuard)
  @Post("payment-requests")
  async createPaymentRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentRequestDto,
  ) {
    return this.paymentsService.createPaymentRequest(user.privyUserId, dto);
  }

  @UseGuards(PrivyAuthGuard)
  @Get("payment-requests/me")
  async paymentRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.paymentRequestsForUser(user.privyUserId);
  }

  @Get("payment-requests/:code")
  async getPaymentRequest(@Param("code") code: string) {
    return this.paymentsService.getPaymentRequest(code);
  }

  @UseGuards(PrivyAuthGuard)
  @Get("transactions/me")
  async history(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.historyForUser(user.privyUserId);
  }

  @Get("transactions/user/:username")
  async publicHistory(@Param("username") username: string) {
    return this.paymentsService.publicHistory(username);
  }

  @UseGuards(PrivyAuthGuard)
  @Get("wallet/balance")
  async balance(@CurrentUser() user: AuthenticatedUser) {
    const profile = await this.usersService.findRawByPrivyUserIdOrThrow(
      user.privyUserId,
    );
    return this.walletsService.getBalance(profile.encryptedSeed);
  }
}
