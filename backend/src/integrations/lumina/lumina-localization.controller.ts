import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { PrivyAuthGuard } from "../../shared/common/guards/privy-auth.guard";
import { TranslateMessageDto } from "./dto/translate-message.dto";
import { LuminaLocalizationService } from "./lumina-localization.service";

@Controller("localization")
@UseGuards(PrivyAuthGuard)
export class LuminaLocalizationController {
  constructor(private readonly localization: LuminaLocalizationService) {}

  @Post("translate")
  translate(@Body() dto: TranslateMessageDto) {
    return this.localization.translateMessage(dto.text, dto.targetLanguage);
  }
}
