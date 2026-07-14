import { IsIn, IsString, MaxLength, MinLength } from "class-validator";

const supportedLocales = ["en", "pt-BR", "zh-CN", "fr"] as const;

export class TranslateMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  text!: string;

  @IsIn(supportedLocales)
  targetLanguage!: (typeof supportedLocales)[number];
}
