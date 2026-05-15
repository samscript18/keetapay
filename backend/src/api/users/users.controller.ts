import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  CurrentUser,
  AuthenticatedUser,
} from "../../shared/common/decorators/current-user.decorator";
import { PrivyAuthGuard } from "../../shared/common/guards/privy-auth.guard";
import { CloudinaryService } from "./cloudinary.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get("availability")
  async availability(@Query("username") username: string) {
    return this.usersService.isUsernameAvailable(username ?? "");
  }

  @Get("search")
  async search(@Query("q") query: string) {
    return this.usersService.searchUsers(query ?? "", 3);
  }

  @Get(":username")
  async publicProfile(@Param("username") username: string) {
    return this.usersService.findPublicByUsername(username);
  }

  @UseGuards(PrivyAuthGuard)
  @Patch("me/settings")
  async settings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.privyUserId, dto);
  }

  @UseGuards(PrivyAuthGuard)
  @Post("me/avatar")
  @UseInterceptors(
    FileInterceptor("avatar", {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) cb(null, true);
        else cb(new BadRequestException("Only images are allowed"), false);
      },
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException("Avatar image is required");
    const uploaded = await this.cloudinaryService.uploadAvatar(file);
    return this.usersService.updateProfileImage(
      user.privyUserId,
      uploaded.secure_url,
    );
  }
}
