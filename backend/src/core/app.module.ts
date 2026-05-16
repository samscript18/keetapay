import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "../api/auth/auth.module";
import { FeedModule } from "../api/feed/feed.module";
import { IdentityModule } from "../api/identity/identity.module";
import { PaymentsModule } from "../api/payments/payments.module";
import { UsersModule } from "../api/users/users.module";
import { WalletsModule } from "../api/wallets/wallets.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 80 }]),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    AuthModule,
    UsersModule,
    WalletsModule,
    IdentityModule,
    PaymentsModule,
    FeedModule,
  ],
})
export class AppModule {}
