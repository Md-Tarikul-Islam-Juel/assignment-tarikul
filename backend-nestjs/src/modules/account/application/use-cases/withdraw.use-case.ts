import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AccountRepositoryPort } from '../../domain/repositories/account.repository.port';
import { TransactionRepositoryPort } from '../../domain/repositories/transaction.repository.port';
import { ACCOUNT_REPOSITORY_PORT, TRANSACTION_REPOSITORY_PORT } from '../di-tokens';
import { UNIT_OF_WORK_PORT } from '../../../../common/persistence/uow/di-tokens';
import { UnitOfWorkPort } from '../../../../common/persistence/uow/uow.port';
import { Transaction } from '../../domain/entities/transaction.entity';
import { TransactionType } from '../../domain/enums/transaction-type.enum';

function generateReferenceNumber(): string {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

@Injectable()
export class WithdrawUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly uow: UnitOfWorkPort
  ) {}

  async execute(accountId: number, amount: number, description?: string): Promise<{ accountId: number; transactionId: number; balanceAfter: number }> {
    if (amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be positive');
    }

    return this.uow.withTransaction(async (tx) => {
      const accountRepo = this.accountRepository.withTx(tx);
      const txRepo = this.transactionRepository.withTx(tx);

      const account = await accountRepo.findById(accountId);
      if (!account || account.isDeleted()) {
        throw new NotFoundException('Account not found');
      }

      // Daily withdrawal limit check
      const dailyLimit = account.dailyWithdrawalLimit;
      if (dailyLimit != null && dailyLimit > 0) {
        const usedToday = await txRepo.getWithdrawalSumForDay(accountId, new Date());
        if (usedToday + amount > dailyLimit) {
          throw new BadRequestException(
            `Daily withdrawal limit exceeded. Limit: ${dailyLimit}, used today: ${usedToday}, requested: ${amount}`
          );
        }
      }

      try {
        account.withdraw(amount);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Withdrawal failed';
        throw new BadRequestException(message);
      }

      await accountRepo.update(account);
      const balanceAfter = account.getBalance();

      const transaction = new Transaction(
        0,
        accountId,
        TransactionType.WITHDRAWAL,
        amount,
        balanceAfter,
        description ?? null,
        generateReferenceNumber(),
        null,
        null,
        null,
        new Date()
      );
      const saved = await txRepo.save(transaction);

      return { accountId, transactionId: saved.id, balanceAfter };
    });
  }
}
