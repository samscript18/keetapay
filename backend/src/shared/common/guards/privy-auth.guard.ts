import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrivyClient } from "@privy-io/server-auth";

@Injectable()
export class PrivyAuthGuard implements CanActivate {
  private readonly privy: PrivyClient;

  constructor(private readonly config: ConfigService) {
    this.privy = new PrivyClient(
      this.config.getOrThrow<string>("PRIVY_APP_ID"),
      this.config.getOrThrow<string>("PRIVY_APP_SECRET"),
    );
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization as string | undefined;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token) throw new UnauthorizedException("Missing Privy bearer token");
    try {
      const verified = await this.privy.verifyAuthToken(token);
      request.user = { privyUserId: verified.userId };
    } catch {
      throw new UnauthorizedException("Invalid Privy session");
    }
    return true;
  }
}
