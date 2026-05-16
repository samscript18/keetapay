import { IsNumberString, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class WithdrawPaymentDto {
  @IsString()
  @MinLength(16)
  @MaxLength(160)
  walletAddress!: string;

  @IsNumberString()
  amount!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  message?: string;
}
