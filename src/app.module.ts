import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { InstitutionService } from './institution/institution.service.js';
import { InstitutionModule } from './institution/institution.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { TransactionModule } from './transaction/transaction.module.js';
import { AccountModule } from './account/account.module.js';
import { LineModule } from './line/line.module.js';
import { SupabaseModule } from './supabase/supabase.module.js';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    InstitutionModule,
    TransactionModule,
    AccountModule,
    LineModule,
    SupabaseModule,
  ],
  providers: [InstitutionService],
})
export class AppModule {}
