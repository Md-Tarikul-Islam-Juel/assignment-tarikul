import { Prisma } from '@prisma/client';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '../enums/transaction-type.enum';

/**
 * Repository Port for Transaction operations
 */
export interface TransactionRepositoryPort {
  findById(id: number): Promise<Transaction | null>;
  findByAccountId(accountId: number, filters?: {
    type?: TransactionType;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    order?: 'asc' | 'desc';
  }): Promise<Transaction[]>;
  findByReferenceNumber(referenceNumber: string): Promise<Transaction | null>;
  
  save(transaction: Transaction): Promise<Transaction>;
  saveMany(transactions: Transaction[]): Promise<Transaction[]>;

  // Query methods
  count(filters?: {
    accountId?: number;
    type?: TransactionType;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number>;

  /** Sum of WITHDRAWAL + TRANSFER_OUT amounts for an account on a given calendar day (UTC). Used for daily limit check. */
  getWithdrawalSumForDay(accountId: number, date: Date): Promise<number>;

  /**
   * Returns a transaction-scoped repository bound to the provided transaction client
   */
  withTx(tx: Prisma.TransactionClient): TransactionRepositoryPort;
}
