import { Injectable } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { LineService } from 'src/line/line.service';

@Injectable()
export class AccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
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
    const data: any = {};
    if (dto.institution_id !== undefined)
      data.institution_id = dto.institution_id;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.kind !== undefined) data.kind = dto.kind;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.base_currency !== undefined) data.base_currency = dto.base_currency;
    if (dto.number_full !== undefined) {
      data.number_full = dto.number_full;
      data.number_masked = this.maskNumber(dto.number_full);
    }
    if (dto.credit_limit_minor !== undefined)
      data.credit_limit_minor = BigInt(dto.credit_limit_minor);
    if (dto.balance_minor !== undefined)
      data.balance_minor = BigInt(dto.balance_minor);
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
