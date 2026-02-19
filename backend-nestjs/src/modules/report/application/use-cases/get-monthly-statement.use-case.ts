import { Inject, Injectable } from '@nestjs/common';
import { TransactionRepositoryPort } from '../../../account/domain/repositories/transaction.repository.port';
import { Transaction } from '../../../account/domain/entities/transaction.entity';
import { TRANSACTION_REPOSITORY_PORT } from '../../../account/application/di-tokens';
import { Account } from '../../../account/domain/entities/account.entity';

export interface MonthlyStatementResult {
  account: Account;
  period: { year: number; month: number; startDate: Date; endDate: Date };
  openingBalance: number;
  transactions: Transaction[];
  closingBalance: number;
}

@Injectable()
export class GetMonthlyStatementUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort
  ) {}

  async execute(
    accountId: number,
    year: number,
    month: number,
    account: Account
  ): Promise<MonthlyStatementResult> {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    const lastMomentPrevMonth = new Date(Date.UTC(year, month - 1, 0, 23, 59, 59, 999));

    const [openingTx, monthTransactions] = await Promise.all([
      this.transactionRepository.findByAccountId(accountId, {
        endDate: lastMomentPrevMonth,
        limit: 1,
        order: 'desc'
      }),
      this.transactionRepository.findByAccountId(accountId, {
        startDate,
        endDate,
        limit: 2000,
        order: 'asc'
      })
    ]);

    const openingBalance = openingTx.length > 0 ? openingTx[0].balanceAfter : 0;
    const closingBalance =
      monthTransactions.length > 0
        ? monthTransactions[monthTransactions.length - 1].balanceAfter
        : openingBalance;

    return {
      account,
      period: { year, month, startDate, endDate },
      openingBalance,
      transactions: monthTransactions,
      closingBalance
    };
  }
}
