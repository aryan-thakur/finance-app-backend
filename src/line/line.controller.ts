import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { LineService } from './line.service.js';
import { CreateLineDto } from './dto/create-line.dto.js';
import { UpdateLineDto } from './dto/update-line.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('line')
export class LineController {
  constructor(private readonly lineService: LineService) {}

  @Post()
  create(@Body() createLineDto: CreateLineDto) {
    return this.lineService.create(createLineDto);
  }

  @Get()
  findAll() {
    return this.lineService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lineService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLineDto: UpdateLineDto) {
    return this.lineService.update(id, updateLineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lineService.remove(id);
  }
}
