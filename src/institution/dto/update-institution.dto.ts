import { IsString, IsOptional } from 'class-validator';

export class UpdateInstitutionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  kind?: string;

  @IsString()
  @IsOptional()
  logo_url?: string;
}
