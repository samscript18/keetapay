import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import {
  IdentityRecord,
  IdentityRecordSchema,
} from "./schemas/identity-record.schema";
import { WalletsModule } from "../wallets/wallets.module";
import { IdentityController } from "./identity.controller";
import { IdentityService } from "./identity.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IdentityRecord.name, schema: IdentityRecordSchema },
    ]),
    WalletsModule,
  ],
  controllers: [IdentityController],
  providers: [IdentityService],
  exports: [IdentityService],
})
export class IdentityModule {}
