import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  CurrentUser,
  AuthenticatedUser,
} from "../../shared/common/decorators/current-user.decorator";
import { PrivyAuthGuard } from "../../shared/common/guards/privy-auth.guard";
import { CreateProfileDto } from "../users/dto/create-profile.dto";
import { UsersService } from "../users/users.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(PrivyAuthGuard)
  @Post("sync")
  async sync(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findOrBootstrap(user.privyUserId);
  }

  @UseGuards(PrivyAuthGuard)
  @Post("profile")
  async createProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProfileDto,
  ) {
    return this.usersService.createProfile(user.privyUserId, dto);
  }

  @UseGuards(PrivyAuthGuard)
  @Get("me")
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findByPrivyUserIdOrThrow(user.privyUserId);
  }
}
