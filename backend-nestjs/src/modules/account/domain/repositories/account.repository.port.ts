import { Prisma } from '@prisma/client';
import { Account } from '../entities/account.entity';
import { AccountNumber } from '../value-objects/account-number.vo';
import { AccountType } from '../enums/account-type.enum';
import { AccountStatus } from '../enums/account-status.enum';

/**
 * Repository Port for Account operations
 * Supports transaction-scoped operations via withTx()
 */
export interface AccountRepositoryPort {
  findById(id: number): Promise<Account | null>;
  findByAccountNumber(accountNumber: AccountNumber): Promise<Account | null>;
  findByUserId(userId: number): Promise<Account[]>;
  findByUserIdAndType(userId: number, type: AccountType): Promise<Account[]>;
  findByAccountNumberString(accountNumber: string): Promise<Account | null>;
  
  save(account: Account): Promise<Account>;
  update(account: Account): Promise<Account>;
  delete(id: number): Promise<void>; // Soft delete
  hardDelete(id: number): Promise<void>; // Permanent delete

  // Partial update methods
  updateBalance(id: number, balance: number, availableBalance: number): Promise<Account>;
  updateBalanceAndLastInterestCreditedAt(id: number, balance: number, availableBalance: number, lastInterestCreditedAt: Date): Promise<Account>;
  updateStatus(id: number, status: AccountStatus): Promise<Account>;

  /** SAVINGS accounts with interestRate > 0 not yet credited for the given month (asOf = start of month). */
  findSavingsAccountsEligibleForMonthlyInterest(asOf: Date): Promise<Account[]>;

  // Query methods
  findAll(filters?: {
    userId?: number;
    type?: AccountType;
    status?: AccountStatus;
    limit?: number;
    offset?: number;
  }): Promise<Account[]>;
  count(filters?: {
    userId?: number;
    type?: AccountType;
    status?: AccountStatus;
  }): Promise<number>;

  /**
   * Returns a transaction-scoped repository bound to the provided transaction client
   */
  withTx(tx: Prisma.TransactionClient): AccountRepositoryPort;
}
