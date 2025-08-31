import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AccountKind {
  asset = 'asset',
  liability = 'liability',
}

export class CreateAccountDto {
  @IsUUID()
  @IsOptional()
  institution_id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(AccountKind)
  @IsNotEmpty()
  kind!: AccountKind;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @Length(3, 3)
  @IsNotEmpty()
  base_currency!: string;

  @IsString()
  @IsNotEmpty()
  number_full!: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  credit_limit_minor?: number;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  balance_minor!: number;

  @IsString()
  @IsOptional()
  status?: string;

  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;
}
