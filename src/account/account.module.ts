import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { AccountController } from './account.controller';
import { AuthModule } from 'src/auth/auth.module';
import { LineModule } from 'src/line/line.module';
import { TransactionModule } from 'src/transaction/transaction.module';

@Module({
  imports: [AuthModule, LineModule, TransactionModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
