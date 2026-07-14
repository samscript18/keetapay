import { ConfigService } from "@nestjs/config";
import { LuminaLocalizationService } from "./lumina-localization.service";

describe("LuminaLocalizationService", () => {
  it("returns English source text without an external request", async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new LuminaLocalizationService(config);

    await expect(service.translateMessage("Send {amount} KTA", "en")).resolves.toEqual({
      translated: "Send {amount} KTA",
      source: "source",
    });
  });

  it("fails closed when translated output is requested without a server credential", async () => {
    const config = { get: jest.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new LuminaLocalizationService(config);

    await expect(service.translateMessage("Send KTA", "fr")).rejects.toMatchObject({ status: 503 });
  });
});
