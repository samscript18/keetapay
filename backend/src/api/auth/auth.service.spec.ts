import { UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";

jest.mock("@privy-io/node", () => ({
  PrivyClient: jest.fn().mockImplementation(() => ({})),
}));

function config() {
  return {
    getOrThrow: (key: string) => `${key.toLowerCase()}-test-value`,
  } as ConfigService;
}

describe("AuthService", () => {
  it("maps a verified Privy access token to the application user identity", async () => {
    const service = new AuthService(config());
    const verifyAccessToken = jest.fn().mockResolvedValue({ user_id: "did:privy:user-1" });
    (service as unknown as { privy: unknown }).privy = {
      utils: () => ({ auth: () => ({ verifyAccessToken }) }),
    };

    await expect(service.verifyPrivyToken("valid-token")).resolves.toEqual({
      privyUserId: "did:privy:user-1",
    });
    expect(verifyAccessToken).toHaveBeenCalledWith("valid-token");
  });

  it("does not expose Privy verification failures", async () => {
    const service = new AuthService(config());
    (service as unknown as { privy: unknown }).privy = {
      utils: () => ({
        auth: () => ({ verifyAccessToken: jest.fn().mockRejectedValue(new Error("private detail")) }),
      }),
    };

    await expect(service.verifyPrivyToken("invalid-token")).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
