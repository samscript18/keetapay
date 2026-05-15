import { IsIn, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePaymentRequestDto {
  @IsNumberString()
  amount!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  message?: string;

  @IsOptional()
  @IsIn(['15m', '1h', '24h', '7d'])
  expiresIn?: '15m' | '1h' | '24h' | '7d';
}
