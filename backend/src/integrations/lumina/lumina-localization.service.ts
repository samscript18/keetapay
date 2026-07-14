import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LuminaClient } from "@lumina-ai/sdk";

@Injectable()
export class LuminaLocalizationService {
  private readonly client?: LuminaClient;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>("LUMINA_API_KEY")?.trim();
    if (apiKey) {
      this.client = new LuminaClient({
        apiKey,
        baseUrl: config.get<string>("LUMINA_BASE_URL") ?? "https://lumina-e3vi.onrender.com",
        timeoutMs: 15_000,
        maxRetries: 1,
        userAgent: "keetapay-backend/1.0.0",
      });
    }
  }

  async translateMessage(text: string, targetLanguage: string) {
    if (targetLanguage === "en") return { translated: text, source: "source" as const };
    if (!this.client) throw new ServiceUnavailableException("Lumina localization is not configured");

    const result = await this.client.translateText({ text, targetLanguage });
    return { translated: result.translated, source: "lumina" as const };
  }
}
