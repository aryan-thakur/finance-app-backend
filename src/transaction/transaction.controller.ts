import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  create(@Req() req, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionService.create(createTransactionDto, req.user.userId);
  }

  @Get()
  findAll(@Req() req) {
    return this.transactionService.findAll(req.user.userId);
  }

  @Get('range')
  findRange(
    @Query('lower', new ParseIntPipe()) lower: number,
    @Query('upper', new ParseIntPipe()) upper: number,
    @Req() req,
  ) {
    return this.transactionService.findRange(lower, upper, req.user.userId);
  }

  @Get('count')
  count(@Req() req) {
    return this.transactionService.countAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.transactionService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
    @Req() req,
  ) {
    return this.transactionService.update(id, updateTransactionDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    // Soft-delete behavior: reverse the transaction instead of deleting
    return this.transactionService.reverseTransaction(id, req.user.userId);
  }
}
