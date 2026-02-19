import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { addMonths } from 'date-fns';
import { AccountRepositoryPort } from '../../../account/domain/repositories/account.repository.port';
import { TransactionRepositoryPort } from '../../../account/domain/repositories/transaction.repository.port';
import { Transaction } from '../../../account/domain/entities/transaction.entity';
import { TransactionType } from '../../../account/domain/enums/transaction-type.enum';
import { ACCOUNT_REPOSITORY_PORT, TRANSACTION_REPOSITORY_PORT } from '../../../account/application/di-tokens';
import { UNIT_OF_WORK_PORT } from '../../../../common/persistence/uow/di-tokens';
import { UnitOfWorkPort } from '../../../../common/persistence/uow/uow.port';
import { SavingsPlanRepositoryPort } from '../../domain/repositories/savings-plan.repository.port';
import { SAVINGS_PLAN_REPOSITORY_PORT } from '../di-tokens';
import { SavingsPlan } from '../../domain/entities/savings-plan.entity';
import { SavingsPlanType } from '../../domain/enums/plan-type.enum';
import { SavingsPlanStatus } from '../../domain/enums/plan-status.enum';
import { AccountType } from '../../../account/domain/enums/account-type.enum';

function generateReferenceNumber(): string {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

@Injectable()
export class CreateFixedDepositUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(SAVINGS_PLAN_REPOSITORY_PORT)
    private readonly savingsPlanRepository: SavingsPlanRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly uow: UnitOfWorkPort,
  ) {}

  async execute(
    userId: number,
    params: { sourceAccountId: number; principal: number; termMonths: number; interestRate: number },
  ): Promise<SavingsPlan> {
    const { sourceAccountId, principal, termMonths, interestRate } = params;
    if (principal <= 0 || termMonths < 1 || interestRate < 0) {
      throw new BadRequestException('Principal and termMonths must be positive; interestRate must be non-negative.');
    }

    const sourceAccount = await this.accountRepository.findById(sourceAccountId);
    if (!sourceAccount || sourceAccount.isDeleted()) {
      throw new NotFoundException('Source account not found');
    }
    if (sourceAccount.userId !== userId) {
      throw new NotFoundException('Source account not found');
    }
    if (sourceAccount.type === AccountType.LOAN) {
      throw new BadRequestException('Cannot use a loan account as source for fixed deposit');
    }
    if (sourceAccount.getAvailableBalance() < principal) {
      throw new BadRequestException('Insufficient balance in source account');
    }

    const startDate = new Date();
    const endDate = addMonths(startDate, termMonths);
    const now = new Date();

    return this.uow.withTransaction(async (tx) => {
      const accountRepo = this.accountRepository.withTx(tx);
      const txRepo = this.transactionRepository.withTx(tx);
      const planRepo = this.savingsPlanRepository.withTx(tx);

      const account = await accountRepo.findById(sourceAccountId)!;
      if (!account) throw new NotFoundException('Account not found');

      account.withdraw(principal);
      await accountRepo.update(account);

      const plan = new SavingsPlan(
        0,
        userId,
        sourceAccountId,
        SavingsPlanType.FIXED_DEPOSIT,
        sourceAccount.currency,
        principal,
        null,
        interestRate,
        termMonths,
        startDate,
        endDate,
        SavingsPlanStatus.ACTIVE,
        0,
        null,
        0,
        null,
        now,
        now,
      );
      const savedPlan = await planRepo.save(plan);

      const withdrawalTx = new Transaction(
        0,
        sourceAccountId,
        TransactionType.WITHDRAWAL,
        principal,
        account.getBalance(),
        `Fixed deposit - Plan #${savedPlan.id}`,
        generateReferenceNumber(),
        null,
        null,
        null,
        now,
      );
      await txRepo.save(withdrawalTx);

      return savedPlan;
    });
  }
}
