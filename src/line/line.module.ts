import { Module } from '@nestjs/common';
import { LineService } from './line.service.js';
import { LineController } from './line.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [LineController],
  providers: [LineService],
  exports: [LineService],
})
export class LineModule {}
