import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsObject,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsString()
  @IsNotEmpty()
  kind!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  meta?: Record<string, any>; // metadata

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsUUID()
  @IsOptional()
  reversal_of?: string;

  @IsUUID()
  @IsOptional()
  account_from?: string;

  @IsUUID()
  @IsOptional()
  account_to?: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  amount_minor?: number; // float-like number per request
}
