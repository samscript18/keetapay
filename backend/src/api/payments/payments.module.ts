import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UsersModule } from "../users/users.module";
import { WalletsModule } from "../wallets/wallets.module";
import { Transaction, TransactionSchema } from "./schemas/transaction.schema";
import {
  PaymentRequest,
  PaymentRequestSchema,
} from "./schemas/payment-request.schema";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Transaction.name, schema: TransactionSchema },
      { name: PaymentRequest.name, schema: PaymentRequestSchema },
    ]),
    UsersModule,
    WalletsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService, MongooseModule],
})
export class PaymentsModule {}
