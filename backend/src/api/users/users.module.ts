import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { IdentityModule } from "../identity/identity.module";
import { WalletsModule } from "../wallets/wallets.module";
import { User, UserSchema } from "./schemas/user.schema";
import { CloudinaryService } from "./cloudinary.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    IdentityModule,
    WalletsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
