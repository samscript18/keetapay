import { IsNumberString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SendPaymentDto {
  @IsString()
  @Matches(/^@?[a-z0-9_]{3,20}$/)
  recipient!: string;

  @IsNumberString()
  amount!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  message?: string;
}
