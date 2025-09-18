import { Injectable } from '@nestjs/common';
import { CreateLineDto } from './dto/create-line.dto.js';
import { UpdateLineDto } from './dto/update-line.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LineService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLineDto) {
    const { transaction_id, account_id, direction, amount_minor, note } = dto;
    return this.prisma.transaction_lines.create({
      data: {
        transaction_id,
        account_id,
        direction,
        amount_minor: BigInt(amount_minor),
        note: note ?? undefined,
      },
    });
  }

  async findAll() {
    return this.prisma.transaction_lines.findMany();
  }

  async findOne(id: string) {
    return this.prisma.transaction_lines.findUnique({ where: { id } });
  }

  async update(id: string, dto: UpdateLineDto) {
    const data: any = {};
    if (dto.transaction_id !== undefined)
      data.transaction_id = dto.transaction_id;
    if (dto.account_id !== undefined) data.account_id = dto.account_id;
    if (dto.direction !== undefined) data.direction = dto.direction;
    if (dto.amount_minor !== undefined)
      data.amount_minor = BigInt(dto.amount_minor);
    if (dto.note !== undefined) data.note = dto.note;
    return this.prisma.transaction_lines.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.transaction_lines.delete({ where: { id } });
  }

  async findByTransactionId(transactionId: string) {
    return this.prisma.transaction_lines.findMany({
      where: { transaction_id: transactionId },
    });
  }

  async findByAccountId(accountId: string) {
    return this.prisma.transaction_lines.findMany({
      where: { account_id: accountId },
      orderBy: { created_at: 'asc' },
    });
  }
}
