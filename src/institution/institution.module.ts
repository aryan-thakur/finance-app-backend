import { Module } from '@nestjs/common';
import { InstitutionService } from './institution.service.js';
import { InstitutionController } from './institution.controller.js';
import { AuthModule } from '../auth/auth.module.js';
@Module({
  imports: [AuthModule],
  controllers: [InstitutionController],
  providers: [InstitutionService],
})
export class InstitutionModule {}
