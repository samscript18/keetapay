import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { IdentityService } from "../identity/identity.service";
import { WalletsService } from "../wallets/wallets.service";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { User } from "./schemas/user.schema";

type RawUser = User & { _id: Types.ObjectId; createdAt?: Date };

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly walletsService: WalletsService,
    private readonly identityService: IdentityService,
  ) {}

  async findOrBootstrap(privyUserId: string) {
    const existingQuery = this.userModel.findOne({ privyUserId });
    existingQuery.select("+encryptedSeed");
    const existing = await existingQuery.lean();
    if (existing) {
      await this.identityService.issueCertificate(existing.encryptedSeed, {});
      return {
        user: await this.publicUser(existing),
        needsUsername: !existing.username,
      };
    }

    const wallet = await this.walletsService.createWallet();
    const created = await this.userModel.create({
      privyUserId,
      walletAddress: wallet.walletAddress,
      encryptedSeed: wallet.encryptedSeed,
    });
    await this.identityService.issueCertificate(wallet.encryptedSeed, {});

    return { user: await this.publicUser(created.toObject()), needsUsername: true };
  }

  async createProfile(privyUserId: string, dto: CreateProfileDto) {
    await this.assertUsernameAvailable(dto.username, privyUserId);
    const user = await this.userModel
      .findOneAndUpdate(
        { privyUserId },
        { username: dto.username },
        { new: true },
      )
      .lean();
    if (!user) throw new NotFoundException("User not found");
    return this.publicUser(user);
  }

  async updateProfile(privyUserId: string, dto: UpdateProfileDto) {
    if (dto.username)
      await this.assertUsernameAvailable(dto.username, privyUserId);
    const user = await this.userModel
      .findOneAndUpdate({ privyUserId }, dto, { new: true })
      .lean();
    if (!user) throw new NotFoundException("User not found");
    return this.publicUser(user);
  }

  async updateProfileImage(privyUserId: string, profileImage: string) {
    const user = await this.userModel
      .findOneAndUpdate({ privyUserId }, { profileImage }, { new: true })
      .lean();
    if (!user) throw new NotFoundException("User not found");
    return this.publicUser(user);
  }

  async isUsernameAvailable(username: string) {
    const normalized = username.replace("@", "").toLowerCase();
    const exists = await this.userModel.exists({ username: normalized });
    return { username: normalized, available: !exists };
  }

  async searchUsers(query: string, limit = 3) {
    const normalized = query.replace("@", "").toLowerCase().trim();
    if (!/^[a-z0-9_]{1,20}$/.test(normalized)) return [];

    const users = await this.userModel
      .find({ username: { $regex: `^${normalized}`, $options: "i" } })
      .sort({ username: 1 })
      .limit(Math.min(limit, 8))
      .lean();

    return Promise.all(users.map((user) => this.publicUser(user)));
  }

  async findByUsernameOrThrow(username: string) {
    const normalized = username.replace("@", "").toLowerCase();
    const user = await this.userModel.findOne({ username: normalized }).lean();
    if (!user) throw new NotFoundException(`@${normalized} was not found`);
    return user;
  }

  async findByPrivyUserIdOrThrow(privyUserId: string) {
    const user = await this.findRawByPrivyUserIdOrThrow(privyUserId);
    return this.publicUser(user);
  }

  async findRawByPrivyUserIdOrThrow(privyUserId: string) {
    const query = this.userModel.findOne({ privyUserId });
    query.select("+encryptedSeed");
    const user = await query.lean();
    if (!user) throw new NotFoundException("User not found");
    return user as RawUser;
  }

  async findPublicByUsername(username: string) {
    const user = await this.findByUsernameOrThrow(username);
    return this.publicUser(user);
  }

  async publicUser(
    user: Partial<User> & { _id?: Types.ObjectId | string; createdAt?: Date },
  ) {
    const identityProof = user.walletAddress
      ? await this.identityService.certificateForWallet(user.walletAddress)
      : undefined;
    return {
      id: String(user._id ?? ""),
      username: user.username,
      walletAddress: user.walletAddress,
      profileImage: user.profileImage,
      bio: user.bio,
      createdAt: user.createdAt,
      identityProof,
    };
  }

  private async assertUsernameAvailable(username: string, privyUserId: string) {
    const existing = await this.userModel.findOne({ username }).lean();
    if (existing && existing.privyUserId !== privyUserId) {
      throw new ConflictException("Username is already taken");
    }
  }
}
