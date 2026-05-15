import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9_]+$/)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  bio?: string;
}
