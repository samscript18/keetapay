import { Module } from "@nestjs/common";
import { PaymentsModule } from "../payments/payments.module";
import { FeedController } from "./feed.controller";

@Module({
  imports: [PaymentsModule],
  controllers: [FeedController],
})
export class FeedModule {}
