import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { InstitutionService } from './institution/institution.service';
import { InstitutionModule } from './institution/institution.module';
import { PrismaModule } from './prisma/prisma.module';
import { TransactionModule } from './transaction/transaction.module';
import { AccountModule } from './account/account.module';
import { LineModule } from './line/line.module';
import { SupabaseModule } from './supabase/supabase.module';

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
