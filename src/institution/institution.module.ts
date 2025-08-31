import { Module } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { InstitutionController } from './institution.controller';
import { AuthModule } from 'src/auth/auth.module';
@Module({
  imports: [AuthModule],
  controllers: [InstitutionController],
  providers: [InstitutionService],
})
export class InstitutionModule {}
