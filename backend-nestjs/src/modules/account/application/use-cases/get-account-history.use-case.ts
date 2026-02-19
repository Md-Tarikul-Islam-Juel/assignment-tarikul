import { Inject, Injectable } from '@nestjs/common';
import { TransactionRepositoryPort } from '../../domain/repositories/transaction.repository.port';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TRANSACTION_REPOSITORY_PORT } from '../di-tokens';

export interface AccountHistoryFilters {
  accountId: number;
  type?: string;
  limit?: number;
  offset?: number;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class GetAccountHistoryUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort
  ) {}

  async execute(filters: AccountHistoryFilters): Promise<{ transactions: Transaction[]; total: number }> {
    const transactions = await this.transactionRepository.findByAccountId(filters.accountId, {
      type: filters.type as any,
      limit: filters.limit,
      offset: filters.offset,
      startDate: filters.startDate,
      endDate: filters.endDate
    });

    const total = await this.transactionRepository.count({
      accountId: filters.accountId,
      type: filters.type as any,
      startDate: filters.startDate,
      endDate: filters.endDate
    });

    return {
      transactions,
      total
    };
  }
}
