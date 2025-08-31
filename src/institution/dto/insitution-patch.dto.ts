import { IsString, IsOptional } from 'class-validator';

export class InstitutionPatchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  kind?: string;
}
