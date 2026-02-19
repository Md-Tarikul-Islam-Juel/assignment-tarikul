import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AccountRepositoryPort } from '../../domain/repositories/account.repository.port';
import { Account } from '../../domain/entities/account.entity';
import { ACCOUNT_REPOSITORY_PORT } from '../di-tokens';

@Injectable()
export class GetAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort
  ) {}

  async execute(accountId: number, userId?: number): Promise<Account> {
    const account = await this.accountRepository.findById(accountId);
    
    if (!account || account.isDeleted()) {
      throw new NotFoundException('Account not found');
    }

    // If userId is provided, ensure user owns the account (unless admin/employee)
    if (userId && account.userId !== userId) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async executeByAccountNumber(accountNumber: string, userId?: number): Promise<Account> {
    const account = await this.accountRepository.findByAccountNumberString(accountNumber);
    
    if (!account || account.isDeleted()) {
      throw new NotFoundException('Account not found');
    }

    // If userId is provided, ensure user owns the account (unless admin/employee)
    if (userId && account.userId !== userId) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }
}
