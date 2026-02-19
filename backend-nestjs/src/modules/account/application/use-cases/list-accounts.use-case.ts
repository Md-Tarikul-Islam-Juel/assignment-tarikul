import { Inject, Injectable } from '@nestjs/common';
import { AccountRepositoryPort } from '../../domain/repositories/account.repository.port';
import { Account } from '../../domain/entities/account.entity';
import { AccountFilters } from '../types/account.types';
import { ACCOUNT_REPOSITORY_PORT } from '../di-tokens';

@Injectable()
export class ListAccountsUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort
  ) {}

  async execute(filters: AccountFilters = {}): Promise<{ accounts: Account[]; total: number }> {
    const accounts = await this.accountRepository.findAll(filters);
    const total = await this.accountRepository.count(filters);

    return {
      accounts,
      total
    };
  }
}
