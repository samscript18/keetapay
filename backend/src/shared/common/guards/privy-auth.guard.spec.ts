import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrivyAuthGuard } from "./privy-auth.guard";

jest.mock("@privy-io/node", () => ({
  PrivyClient: jest.fn().mockImplementation(() => ({})),
}));

function config() {
  return {
    getOrThrow: (key: string) => `${key.toLowerCase()}-test-value`,
  } as ConfigService;
}

function context(request: { headers: { authorization?: string }; user?: unknown }) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe("PrivyAuthGuard", () => {
  it("authenticates a bearer token and attaches the verified user", async () => {
    const guard = new PrivyAuthGuard(config());
    const verifyAccessToken = jest.fn().mockResolvedValue({ user_id: "did:privy:user-2" });
    (guard as unknown as { privy: unknown }).privy = {
      utils: () => ({ auth: () => ({ verifyAccessToken }) }),
    };
    const request = { headers: { authorization: "Bearer valid-token" }, user: undefined };

    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request.user).toEqual({ privyUserId: "did:privy:user-2" });
  });

  it("rejects requests without a bearer token", async () => {
    const guard = new PrivyAuthGuard(config());
    await expect(guard.canActivate(context({ headers: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
