import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../platform/prisma/prisma.service';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionRepositoryPort } from '../../domain/repositories/transaction.repository.port';
import { TransactionType } from '../../domain/enums/transaction-type.enum';
import { TransactionPrismaMapper } from './transaction.prisma.mapper';

@Injectable()
export class TransactionPrismaRepository implements TransactionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  withTx(tx: Prisma.TransactionClient): TransactionRepositoryPort {
    return new TransactionScopedTransactionRepository(tx);
  }

  async findById(id: number): Promise<Transaction | null> {
    const prismaTransaction = await this.prisma.transaction.findUnique({
      where: { id }
    });
    return prismaTransaction ? TransactionPrismaMapper.toDomain(prismaTransaction) : null;
  }

  async findByAccountId(
    accountId: number,
    filters?: {
      type?: TransactionType;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = {
      accountId
    };

    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    type OrderFilter = { order?: 'asc' | 'desc' };
    const order = (filters as OrderFilter | undefined)?.order ?? 'desc';
    const prismaTransactions = await this.prisma.transaction.findMany({
      where,
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: order }
    });

    return prismaTransactions.map(TransactionPrismaMapper.toDomain);
  }

  async findByReferenceNumber(referenceNumber: string): Promise<Transaction | null> {
    const prismaTransaction = await this.prisma.transaction.findUnique({
      where: { referenceNumber }
    });
    return prismaTransaction ? TransactionPrismaMapper.toDomain(prismaTransaction) : null;
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const data = TransactionPrismaMapper.toPersistence(transaction);
    const prismaTransaction = await this.prisma.transaction.create({
      data: {
        accountId: data.accountId!,
        type: data.type!,
        amount: data.amount!,
        balanceAfter: data.balanceAfter!,
        description: data.description,
        referenceNumber: data.referenceNumber,
        relatedAccountId: data.relatedAccountId,
        relatedTransactionId: data.relatedTransactionId,
        metadata: data.metadata
      } as any
    });
    return TransactionPrismaMapper.toDomain(prismaTransaction);
  }

  async saveMany(transactions: Transaction[]): Promise<Transaction[]> {
    const created: Transaction[] = [];
    for (const t of transactions) {
      const saved = await this.save(t);
      created.push(saved);
    }
    return created;
  }

  async count(filters?: {
    accountId?: number;
    type?: TransactionType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const where: Prisma.TransactionWhereInput = {};

    if (filters?.accountId) {
      where.accountId = filters.accountId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return this.prisma.transaction.count({ where });
  }

  async getWithdrawalSumForDay(accountId: number, date: Date): Promise<number> {
    const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
    const result = await this.prisma.transaction.aggregate({
      where: {
        accountId,
        type: { in: ['WITHDRAWAL', 'TRANSFER_OUT'] },
        createdAt: { gte: startOfDay, lte: endOfDay }
      },
      _sum: { amount: true }
    });
    return Number(result._sum.amount ?? 0);
  }
}

class TransactionScopedTransactionRepository implements TransactionRepositoryPort {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  withTx(tx: Prisma.TransactionClient): TransactionRepositoryPort {
    return new TransactionScopedTransactionRepository(tx);
  }

  async findById(id: number): Promise<Transaction | null> {
    const prismaTransaction = await this.tx.transaction.findUnique({
      where: { id }
    });
    return prismaTransaction ? TransactionPrismaMapper.toDomain(prismaTransaction) : null;
  }

  async findByAccountId(
    accountId: number,
    filters?: {
      type?: TransactionType;
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = { accountId };
    if (filters?.type) where.type = filters.type;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    type OrderFilter = { order?: 'asc' | 'desc' };
    const order = (filters as OrderFilter | undefined)?.order ?? 'desc';
    const prismaTransactions = await this.tx.transaction.findMany({
      where,
      take: filters?.limit,
      skip: filters?.offset,
      orderBy: { createdAt: order }
    });
    return prismaTransactions.map(TransactionPrismaMapper.toDomain);
  }

  async findByReferenceNumber(referenceNumber: string): Promise<Transaction | null> {
    const prismaTransaction = await this.tx.transaction.findUnique({
      where: { referenceNumber }
    });
    return prismaTransaction ? TransactionPrismaMapper.toDomain(prismaTransaction) : null;
  }

  async save(transaction: Transaction): Promise<Transaction> {
    const data = TransactionPrismaMapper.toPersistence(transaction);
    const prismaTransaction = await this.tx.transaction.create({
      data: {
        accountId: data.accountId!,
        type: data.type!,
        amount: data.amount!,
        balanceAfter: data.balanceAfter!,
        description: data.description,
        referenceNumber: data.referenceNumber,
        relatedAccountId: data.relatedAccountId,
        relatedTransactionId: data.relatedTransactionId,
        metadata: data.metadata
      } as any
    });
    return TransactionPrismaMapper.toDomain(prismaTransaction);
  }

  async saveMany(transactions: Transaction[]): Promise<Transaction[]> {
    const created: Transaction[] = [];
    for (const t of transactions) {
      const saved = await this.save(t);
      created.push(saved);
    }
    return created;
  }

  async count(filters?: {
    accountId?: number;
    type?: TransactionType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    const where: Prisma.TransactionWhereInput = {};
    if (filters?.accountId) where.accountId = filters.accountId;
    if (filters?.type) where.type = filters.type;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }
    return this.tx.transaction.count({ where });
  }

  async getWithdrawalSumForDay(accountId: number, date: Date): Promise<number> {
    const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999));
    const result = await this.tx.transaction.aggregate({
      where: {
        accountId,
        type: { in: ['WITHDRAWAL', 'TRANSFER_OUT'] },
        createdAt: { gte: startOfDay, lte: endOfDay }
      },
      _sum: { amount: true }
    });
    return Number(result._sum.amount ?? 0);
  }
}
