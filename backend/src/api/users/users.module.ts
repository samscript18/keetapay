import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { WalletsModule } from "../wallets/wallets.module";
import { User, UserSchema } from "./schemas/user.schema";
import { CloudinaryService } from "./cloudinary.service";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    WalletsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
