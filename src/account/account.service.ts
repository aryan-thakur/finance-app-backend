import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LineService } from 'src/line/line.service';
import { TransactionService } from 'src/transaction/transaction.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
    private readonly transactionService: TransactionService,
  ) {}

  private maskNumber(full: string): string {
    const last4 = full.slice(-4);
    const maskedPrefix = '*'.repeat(Math.max(0, full.length - 4));
    return maskedPrefix + last4;
  }

  async create(dto: CreateAccountDto) {
    const {
      institution_id,
      name,
      kind,
      type,
      base_currency,
      number_full,
      credit_limit_minor,
      balance_minor,
      status,
      meta,
    } = dto;

    const number_masked = this.maskNumber(number_full);

    return this.prisma.accounts.create({
      data: {
        institution_id: institution_id ?? undefined,
        name: name ?? '',
        kind,
        type: type ?? undefined,
        base_currency,
        number_full,
        number_masked,
        credit_limit_minor: credit_limit_minor,
        balance_minor: balance_minor,
        status: status ?? undefined,
        meta: meta ?? undefined,
      },
    });
  }

  async findAll() {
    const rows = await this.prisma.accounts.findMany();
    return rows.map(({ number_full, ...rest }) => rest);
  }

  async findOne(id: string) {
    const row = await this.prisma.accounts.findUnique({ where: { id } });
    if (!row) return null;
    const { number_full, ...rest } = row as any;
    return rest;
  }

  async update(id: string, dto: UpdateAccountDto) {
    const row = await this.prisma.accounts.findUnique({ where: { id } });
    if (!row) {
      throw new BadRequestException(`Account with id ${id} not found.`);
    }
    const data: any = {};
    if (dto.institution_id !== undefined)
      data.institution_id = dto.institution_id;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.kind !== undefined) data.kind = dto.kind;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.base_currency !== undefined) data.base_currency = dto.base_currency;
    if (!dto.number_full) {
      data.number_full = dto.number_full;
      data.number_masked = this.maskNumber(dto.number_full);
    }
    if (dto.credit_limit_minor !== undefined)
      data.credit_limit_minor = BigInt(dto.credit_limit_minor);
    if (dto.balance_minor !== undefined) {
      const currentBalance = await this.calculateBalance(id);
      if (dto.balance_minor != currentBalance) {
        const delta = Number(dto.balance_minor) - currentBalance;
        if (delta < 0) {
          await this.transactionService.create({
            kind: 'adjustment',
            account_from: id,
            amount_minor: Math.abs(delta),
            description: 'Balance decreased adjustment',
          });
        } else if (delta > 0) {
          await this.transactionService.create({
            kind: 'adjustment',
            account_to: id,
            amount_minor: delta,
            description: 'Balance increased adjustment',
          });
        }
      }
    }
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.meta !== undefined) data.meta = dto.meta;

    return this.prisma.accounts.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.accounts.delete({ where: { id } });
  }

  async getNumberFull(id: string) {
    const row = await this.prisma.accounts.findUnique({
      where: { id },
      select: { number_full: true },
    });
    return row?.number_full ?? null;
  }

  async calculateBalance(accountId: string): Promise<number> {
    const account = await this.prisma.accounts.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new Error('Account not found');
    const opening = Number(((account as any).balance_minor as bigint) ?? 0n);
    const kind: 'asset' | 'liability' = (account as any).kind;

    const lines = await this.lineService.findByAccountId(accountId);
    let debit = 0;
    let credit = 0;
    for (const line of lines) {
      const amt = Number((line as any).amount_minor as bigint);
      if (line.direction === 'debit') debit -= amt;
      else credit += amt;
    }

    if (kind === 'liability') {
      // For liabilities: debit decreases, credit increases
      return opening + debit - credit;
    }
    // For assets: debit increases, credit decreases
    return opening - debit + credit;
  }
}
