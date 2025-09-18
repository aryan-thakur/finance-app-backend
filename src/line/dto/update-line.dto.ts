import { PartialType } from '@nestjs/mapped-types';
import { CreateLineDto } from './create-line.dto.js';

export class UpdateLineDto extends PartialType(CreateLineDto) {}
