import { Transaction as PrismaTransaction, Prisma } from '@prisma/client';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType } from '../../domain/enums/transaction-type.enum';

export class TransactionPrismaMapper {
  static toDomain(prismaTransaction: PrismaTransaction): Transaction {
    return new Transaction(
      prismaTransaction.id,
      prismaTransaction.accountId,
      prismaTransaction.type as TransactionType,
      Number(prismaTransaction.amount),
      Number(prismaTransaction.balanceAfter),
      prismaTransaction.description,
      prismaTransaction.referenceNumber,
      prismaTransaction.relatedAccountId,
      prismaTransaction.relatedTransactionId,
      prismaTransaction.metadata as Record<string, unknown> | null,
      prismaTransaction.createdAt
    );
  }

  static toPersistence(domainTransaction: Transaction): Partial<PrismaTransaction> {
    return {
      id: domainTransaction.id,
      accountId: domainTransaction.accountId,
      type: domainTransaction.type,
      amount: new Prisma.Decimal(domainTransaction.amount),
      balanceAfter: new Prisma.Decimal(domainTransaction.balanceAfter),
      description: domainTransaction.description,
      referenceNumber: domainTransaction.referenceNumber,
      relatedAccountId: domainTransaction.relatedAccountId,
      relatedTransactionId: domainTransaction.relatedTransactionId,
      metadata: domainTransaction.metadata as Prisma.JsonValue | null,
      createdAt: domainTransaction.createdAt
    };
  }
}
