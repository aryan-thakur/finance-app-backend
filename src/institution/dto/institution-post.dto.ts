import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class InstitutionPostDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  kind?: string;
}
