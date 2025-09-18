import { Module } from '@nestjs/common';
import { AccountService } from './account.service.js';
import { AccountController } from './account.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { LineModule } from '../line/line.module.js';
import { TransactionModule } from '../transaction/transaction.module.js';

@Module({
  imports: [AuthModule, LineModule, TransactionModule],
  controllers: [AccountController],
  providers: [AccountService],
})
export class AccountModule {}
