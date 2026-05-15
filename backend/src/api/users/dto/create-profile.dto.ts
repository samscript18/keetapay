import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Username must be lowercase letters, numbers, and underscores only',
  })
  username!: string;
}
