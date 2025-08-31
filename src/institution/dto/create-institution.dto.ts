import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateInstitutionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  kind: string;

  @IsString()
  logo_url: string;
}
