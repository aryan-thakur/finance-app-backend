import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString() username: string;
  @MinLength(4) password: string;
}
