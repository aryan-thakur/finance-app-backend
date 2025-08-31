import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export enum LineDirection {
  debit = 'debit',
  credit = 'credit',
}

export class CreateLineDto {
  @IsUUID()
  @IsNotEmpty()
  transaction_id!: string;

  @IsUUID()
  @IsNotEmpty()
  account_id!: string;

  @IsEnum(LineDirection)
  @IsNotEmpty()
  direction!: LineDirection;

  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  amount_minor!: number;

  @IsOptional()
  @IsString()
  note?: string;
}
