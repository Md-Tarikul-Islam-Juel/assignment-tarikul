import { Injectable } from '@nestjs/common';
import { CreateAccountCommand } from '../commands/create-account.command';
import { UpdateAccountCommand } from '../commands/update-account.command';
import { CreateAccountUseCase } from '../use-cases/create-account.use-case';
import { GetAccountUseCase } from '../use-cases/get-account.use-case';
import { ListAccountsUseCase } from '../use-cases/list-accounts.use-case';
import { UpdateAccountUseCase } from '../use-cases/update-account.use-case';
import { DeleteAccountUseCase } from '../use-cases/delete-account.use-case';
import { GetAccountHistoryUseCase } from '../use-cases/get-account-history.use-case';
import { DepositUseCase } from '../use-cases/deposit.use-case';
import { WithdrawUseCase } from '../use-cases/withdraw.use-case';
import { TransferUseCase } from '../use-cases/transfer.use-case';
import { AccountFilters } from '../types/account.types';
import { AccountHistoryFilters } from '../use-cases/get-account-history.use-case';

@Injectable()
export class AccountService {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
    private readonly getAccountHistoryUseCase: GetAccountHistoryUseCase,
    private readonly depositUseCase: DepositUseCase,
    private readonly withdrawUseCase: WithdrawUseCase,
    private readonly transferUseCase: TransferUseCase
  ) {}

  async createAccount(command: CreateAccountCommand) {
    return this.createAccountUseCase.execute(command);
  }

  async getAccount(accountId: number, userId?: number) {
    return this.getAccountUseCase.execute(accountId, userId);
  }

  async getAccountByAccountNumber(accountNumber: string, userId?: number) {
    return this.getAccountUseCase.executeByAccountNumber(accountNumber, userId);
  }

  async listAccounts(filters: AccountFilters) {
    return this.listAccountsUseCase.execute(filters);
  }

  async updateAccount(command: UpdateAccountCommand) {
    return this.updateAccountUseCase.execute(command);
  }

  async deleteAccount(accountId: number, hardDelete: boolean = false) {
    return this.deleteAccountUseCase.execute(accountId, hardDelete);
  }

  async getAccountHistory(filters: AccountHistoryFilters) {
    return this.getAccountHistoryUseCase.execute(filters);
  }

  async deposit(accountId: number, amount: number, description?: string) {
    return this.depositUseCase.execute(accountId, amount, description);
  }

  async withdraw(accountId: number, amount: number, description?: string) {
    return this.withdrawUseCase.execute(accountId, amount, description);
  }

  async transfer(fromAccountId: number, toAccountNumber: string, amount: number, description?: string) {
    return this.transferUseCase.execute(fromAccountId, toAccountNumber, amount, description);
  }
}
