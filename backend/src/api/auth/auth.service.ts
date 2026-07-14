import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrivyClient } from "@privy-io/node";
import { AuthenticatedUser } from "../../shared/common/decorators/current-user.decorator";

@Injectable()
export class AuthService {
  private readonly privy: PrivyClient;

  constructor(private readonly config: ConfigService) {
    this.privy = new PrivyClient({
      appId: this.config.getOrThrow<string>("PRIVY_APP_ID"),
      appSecret: this.config.getOrThrow<string>("PRIVY_APP_SECRET"),
    });
  }

  async verifyPrivyToken(token: string): Promise<AuthenticatedUser> {
    try {
      const verified = await this.privy.utils().auth().verifyAccessToken(token);
      return {
        privyUserId: verified.user_id,
      };
    } catch {
      throw new UnauthorizedException("Invalid Privy session");
    }
  }
}
