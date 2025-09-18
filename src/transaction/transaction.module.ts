import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service.js';
import { TransactionController } from './transaction.controller.js';
import { LineModule } from '../line/line.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [LineModule, AuthModule],
  controllers: [TransactionController],
  providers: [TransactionService],
  exports: [TransactionService],
})
export class TransactionModule {}
