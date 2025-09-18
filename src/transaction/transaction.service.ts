import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { LineService } from '../line/line.service.js';
import { LineDirection } from '../line/dto/create-line.dto.js';

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lineService: LineService,
  ) {}

  async create(dto: CreateTransactionDto, userId: string) {
    const { account_from, account_to, amount_minor, ...txnFields } = dto as any;

    // If amount is provided and is zero, reject the request
    if (Object.prototype.hasOwnProperty.call(dto, 'amount_minor')) {
      if (typeof amount_minor !== 'number' || !Number.isFinite(amount_minor)) {
        throw new BadRequestException('amount_minor must be a valid number');
      }
      if (Math.trunc(amount_minor) === 0) {
        throw new BadRequestException('amount_minor cannot be zero');
      }
    }

    if (!account_from && !account_to && !txnFields.reversal_of) {
      throw new BadRequestException(
        'At least one of account_from or account_to is required',
      );
    }

    const transaction = await this.prisma.transactions.create({
      data: {
        kind: txnFields.kind,
        description: txnFields.description ?? undefined,
        tags: txnFields.tags ?? undefined,
        meta: txnFields.meta ?? undefined,
        reversal_of: txnFields.reversal_of ?? undefined,
        user_id: userId,
      },
    });

    // Create corresponding lines if accounts provided
    if (account_from || account_to) {
      if (typeof amount_minor !== 'number' || !Number.isFinite(amount_minor)) {
        throw new BadRequestException(
          'amount_minor must be provided as a number',
        );
      }
      const amountInt = Math.trunc(amount_minor);

      // If both accounts present, ensure same base currency
      if (account_from && account_to) {
        const [fromAcc, toAcc] = await Promise.all([
          this.prisma.accounts.findUnique({ where: { id: account_from } }),
          this.prisma.accounts.findUnique({ where: { id: account_to } }),
        ]);
        if (!fromAcc || !toAcc) {
          throw new BadRequestException('One or both accounts not found');
        }
        if (fromAcc.base_currency !== toAcc.base_currency) {
          throw new BadRequestException(
            `Currency mismatch between accounts: from=${fromAcc.base_currency} to=${toAcc.base_currency}`,
          );
        }
      }

      if (account_from) {
        await this.lineService.create({
          transaction_id: transaction.id,
          account_id: account_from,
          direction: LineDirection.debit,
          amount_minor: amountInt,
        });
      }

      if (account_to) {
        await this.lineService.create({
          transaction_id: transaction.id,
          account_id: account_to,
          direction: LineDirection.credit,
          amount_minor: amountInt,
        });
      }
    }

    return transaction;
  }

  async findAll(userId: string) {
    const rows = await this.prisma.transactions.findMany({
      where: { user_id: userId },
    });
    const withLines = await Promise.all(
      rows.map(async (row) => {
        const lines = await this.lineService.findByTransactionId(row.id);
        return { ...row, lines } as any;
      }),
    );
    return withLines;
  }

  async findOne(id: string, userId: string) {
    const row = await this.prisma.transactions.findFirst({
      where: { id, user_id: userId },
    });
    if (!row) return null;
    const lines = await this.lineService.findByTransactionId(id);
    return { ...row, lines } as any;
  }

  async findRange(lower: number, upper: number, userId: string) {
    const lo = Math.trunc(Number(lower));
    const hi = Math.trunc(Number(upper));
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo < 1 || hi < lo) {
      throw new BadRequestException(
        'Invalid range: ensure lower >= 1 and upper >= lower',
      );
    }
    const skip = lo - 1;
    const take = hi - lo + 1;
    const rows = await this.prisma.transactions.findMany({
      where: { user_id: userId },
      orderBy: { date: 'desc' },
      skip,
      take,
    });
    const withLines = await Promise.all(
      rows.map(async (row) => {
        const lines = await this.lineService.findByTransactionId(row.id);
        return { ...row, lines } as any;
      }),
    );
    return withLines;
  }

  async countAll(userId: string) {
    const total = await this.prisma.transactions.count({
      where: { user_id: userId },
    });
    return { total };
  }

  async update(id: string, dto: UpdateTransactionDto, userId: string) {
    // Fetch existing to check immutable fields
    const existing = await this.prisma.transactions.findFirst({
      where: { id, user_id: userId },
    });
    if (!existing) throw new BadRequestException('Transaction not found');

    // Block changes to reversal_of and reversed_by if value would change
    if (
      Object.prototype.hasOwnProperty.call(dto, 'reversal_of') &&
      dto.reversal_of !== existing.reversal_of
    ) {
      throw new BadRequestException('reversal_of cannot be updated');
    }

    const { account_from, account_to, amount_minor, ...txnFields } = dto as any;

    // If amount is provided and is zero, reject the request
    if (Object.prototype.hasOwnProperty.call(dto, 'amount_minor')) {
      if (typeof amount_minor !== 'number' || !Number.isFinite(amount_minor)) {
        throw new BadRequestException('amount_minor must be a valid number');
      }
      if (Math.trunc(amount_minor) === 0) {
        throw new BadRequestException('amount_minor cannot be zero');
      }
    }

    if (
      !(
        Object.prototype.hasOwnProperty.call(dto, 'account_from') ||
        Object.prototype.hasOwnProperty.call(dto, 'account_to')
      )
    ) {
      throw new BadRequestException('must be an account involved');
    }

    const data: any = {};
    if (txnFields.kind !== undefined) data.kind = txnFields.kind;
    if (txnFields.description !== undefined)
      data.description = txnFields.description;
    if (txnFields.tags !== undefined) data.tags = txnFields.tags;
    if (txnFields.meta !== undefined) data.meta = txnFields.meta;
    // Do not include reversal_of or reversed_by in update data

    const involvesLines =
      Object.prototype.hasOwnProperty.call(dto, 'account_from') ||
      Object.prototype.hasOwnProperty.call(dto, 'account_to') ||
      Object.prototype.hasOwnProperty.call(dto, 'amount_minor');

    const updated = await this.prisma.transactions.update({
      where: { id },
      data,
    });

    if (!involvesLines) {
      return updated;
    }

    // Reverse existing lines in-place by adding opposite-direction entries
    await this.reverseTransactionLinesInPlace(id);

    // Then create new lines if accounts provided
    const hasFrom = typeof account_from === 'string' && account_from.length > 0;
    const hasTo = typeof account_to === 'string' && account_to.length > 0;
    if (hasFrom || hasTo) {
      if (typeof amount_minor !== 'number' || !Number.isFinite(amount_minor)) {
        throw new BadRequestException(
          'amount_minor must be provided as a number',
        );
      }
      const amountInt = Math.trunc(amount_minor);

      // If both accounts present, ensure same base currency
      if (hasFrom && hasTo) {
        const [fromAcc, toAcc] = await Promise.all([
          this.prisma.accounts.findUnique({ where: { id: account_from } }),
          this.prisma.accounts.findUnique({ where: { id: account_to } }),
        ]);
        if (!fromAcc || !toAcc) {
          throw new BadRequestException('One or both accounts not found');
        }
        if (fromAcc.base_currency !== toAcc.base_currency) {
          throw new BadRequestException(
            `Currency mismatch between accounts: from=${fromAcc.base_currency} to=${toAcc.base_currency}`,
          );
        }
      }
      if (hasFrom) {
        await this.lineService.create({
          transaction_id: id,
          account_id: account_from,
          direction: LineDirection.debit,
          amount_minor: amountInt,
        });
      }
      if (hasTo) {
        await this.lineService.create({
          transaction_id: id,
          account_id: account_to,
          direction: LineDirection.credit,
          amount_minor: amountInt,
        });
      }
    }

    return updated;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.transactions.findFirst({
      where: { id, user_id: userId },
      select: { id: true },
    });
    if (!existing) {
      throw new BadRequestException('Transaction not found');
    }
    return this.prisma.transactions.delete({ where: { id } });
  }

  async reverseTransaction(id: string, userId: string) {
    const original = await this.prisma.transactions.findFirst({
      where: { id, user_id: userId },
    });
    if (!original) throw new BadRequestException('Transaction not found');
    if (original.reversed_by || original.reversal_of) {
      throw new BadRequestException(
        'Transaction is already reversed or is a reversal',
      );
    }

    // Create a new transaction that reverses the original
    const reversed = await this.create(
      {
        kind: 'reversal',
        description: original.description ?? undefined,
        tags: (original as any).tags ?? undefined,
        meta: original.meta as any,
        reversal_of: id,
      } as CreateTransactionDto,
      userId,
    );

    // Create opposite lines for the reversed transaction
    const origLines = await this.lineService.findByTransactionId(id);
    for (const line of origLines) {
      await this.lineService.create({
        transaction_id: reversed.id,
        account_id: line.account_id,
        direction:
          line.direction === 'debit'
            ? LineDirection.credit
            : LineDirection.debit,
        amount_minor: Number(line.amount_minor as any),
        note: line.note ?? undefined,
      });
    }

    // Update original to set reversed_by to the new transaction ID
    await this.prisma.transactions.update({
      where: { id },
      data: { reversed_by: reversed.id },
    });

    return reversed;
  }

  private async reverseTransactionLinesInPlace(id: string) {
    const origLines = await this.lineService.findByTransactionId(id);

    for (const line of origLines) {
      await this.lineService.create({
        transaction_id: id,
        account_id: line.account_id,
        direction:
          line.direction === 'debit'
            ? LineDirection.credit
            : LineDirection.debit,
        amount_minor: Number(line.amount_minor as any),
        note: line.note ?? undefined,
      });
    }
  }
}
