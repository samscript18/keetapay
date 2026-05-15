import { Controller, Get, Query } from "@nestjs/common";
import { PaymentsService } from "../payments/payments.service";

@Controller("feed")
export class FeedController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get("live")
  async live(@Query("limit") limit = "30") {
    return this.paymentsService.liveFeed(Math.min(Number(limit) || 30, 80));
  }
}
