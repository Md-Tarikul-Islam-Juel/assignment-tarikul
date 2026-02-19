import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { addMonths } from 'date-fns';
import { AccountRepositoryPort } from '../../../account/domain/repositories/account.repository.port';
import { SavingsPlanRepositoryPort } from '../../domain/repositories/savings-plan.repository.port';
import { SAVINGS_PLAN_REPOSITORY_PORT } from '../di-tokens';
import { ACCOUNT_REPOSITORY_PORT } from '../../../account/application/di-tokens';
import { SavingsPlan } from '../../domain/entities/savings-plan.entity';
import { SavingsPlanType } from '../../domain/enums/plan-type.enum';
import { SavingsPlanStatus } from '../../domain/enums/plan-status.enum';
import { AccountType } from '../../../account/domain/enums/account-type.enum';

@Injectable()
export class CreateRecurringDepositUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(SAVINGS_PLAN_REPOSITORY_PORT)
    private readonly savingsPlanRepository: SavingsPlanRepositoryPort,
  ) {}

  async execute(
    userId: number,
    params: { sourceAccountId: number; monthlyAmount: number; termMonths: number; interestRate: number },
  ): Promise<SavingsPlan> {
    const { sourceAccountId, monthlyAmount, termMonths, interestRate } = params;
    if (monthlyAmount <= 0 || termMonths < 1 || interestRate < 0) {
      throw new BadRequestException('Monthly amount and termMonths must be positive; interestRate must be non-negative.');
    }

    const sourceAccount = await this.accountRepository.findById(sourceAccountId);
    if (!sourceAccount || sourceAccount.isDeleted()) {
      throw new NotFoundException('Source account not found');
    }
    if (sourceAccount.userId !== userId) {
      throw new NotFoundException('Source account not found');
    }
    if (sourceAccount.type === AccountType.LOAN) {
      throw new BadRequestException('Cannot use a loan account as source for recurring deposit');
    }

    const startDate = new Date();
    const endDate = addMonths(startDate, termMonths);
    const nextDueDate = addMonths(startDate, 1);
    const now = new Date();

    const plan = new SavingsPlan(
      0,
      userId,
      sourceAccountId,
      SavingsPlanType.RECURRING_DEPOSIT,
      sourceAccount.currency,
      null,
      monthlyAmount,
      interestRate,
      termMonths,
      startDate,
      endDate,
      SavingsPlanStatus.ACTIVE,
      0,
      null,
      0,
      nextDueDate,
      now,
      now,
    );
    return this.savingsPlanRepository.save(plan);
  }
}
