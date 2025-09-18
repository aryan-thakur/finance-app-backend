import {
  Controller,
  Req,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AccountService } from './account.service.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { UpdateAccountDto } from './dto/update-account.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@Req() req, @Body() createAccountDto: CreateAccountDto) {
    return this.accountService.create(createAccountDto, req.user.userId);
  }

  @Get()
  async findAll(@Req() req) {
    const userId = req.user.userId;
    const rows = await this.accountService.findAll(userId);
    const withBalances = await Promise.all(
      rows.map(async (row: any) => ({
        ...row,
        computed_balance_minor: await this.accountService.calculateBalance(
          row.id,
          userId,
        ),
      })),
    );
    return withBalances;
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId;
    const row = await this.accountService.findOne(id, userId);
    if (!row) return null;
    const computed_balance_minor = await this.accountService.calculateBalance(
      id,
      userId,
    );
    return { ...row, computed_balance_minor };
  }

  @Get(':id/number_full')
  getNumberFull(@Param('id') id: string, @Req() req) {
    return this.accountService.getNumberFull(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @Req() req,
  ) {
    return this.accountService.update(id, updateAccountDto, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    return this.accountService.remove(id, req.user.userId);
  }
}
