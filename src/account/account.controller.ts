import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountService.create(createAccountDto);
  }

  @Get()
  findAll() {
    return (async () => {
      const rows = await this.accountService.findAll();
      const withBalances = await Promise.all(
        rows.map(async (row: any) => ({
          ...row,
          computed_balance_minor: await this.accountService.calculateBalance(row.id),
        })),
      );
      return withBalances;
    })();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return (async () => {
      const row = await this.accountService.findOne(id);
      if (!row) return null;
      const computed_balance_minor = await this.accountService.calculateBalance(id);
      return { ...row, computed_balance_minor };
    })();
  }

  @Get(":id/number_full")
  getNumberFull(@Param('id') id: string) {
    return this.accountService.getNumberFull(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountService.update(id, updateAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountService.remove(id);
  }
}
