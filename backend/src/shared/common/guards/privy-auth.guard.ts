import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrivyClient } from "@privy-io/node";

@Injectable()
export class PrivyAuthGuard implements CanActivate {
  private readonly privy: PrivyClient;

  constructor(private readonly config: ConfigService) {
    this.privy = new PrivyClient({
      appId: this.config.getOrThrow<string>("PRIVY_APP_ID"),
      appSecret: this.config.getOrThrow<string>("PRIVY_APP_SECRET"),
    });
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) throw new UnauthorizedException("Missing Privy bearer token");
    try {
      const verified = await this.privy.utils().auth().verifyAccessToken(token);
      request.user = { privyUserId: verified.user_id };
    } catch {
      throw new UnauthorizedException("Invalid Privy session");
    }
    return true;
  }
}
