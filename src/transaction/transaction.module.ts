import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { TransactionController } from './transaction.controller';
import { LineModule } from 'src/line/line.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [LineModule, AuthModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
