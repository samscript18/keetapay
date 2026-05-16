import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsBoolean, IsNumberString, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

export class BatchPaymentItemDto {
  @IsString()
  @Matches(/^@?[a-z0-9_]{3,20}$/)
  recipient!: string;

  @IsNumberString()
  amount!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  message?: string;

  @IsOptional()
  @IsBoolean()
  privateMode?: boolean;
}

export class SendManyPaymentsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => BatchPaymentItemDto)
  payments!: BatchPaymentItemDto[];
}
