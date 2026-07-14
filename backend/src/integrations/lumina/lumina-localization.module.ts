import { Module } from "@nestjs/common";
import { LuminaLocalizationController } from "./lumina-localization.controller";
import { LuminaLocalizationService } from "./lumina-localization.service";

@Module({
  controllers: [LuminaLocalizationController],
  providers: [LuminaLocalizationService],
  exports: [LuminaLocalizationService],
})
export class LuminaLocalizationModule {}
