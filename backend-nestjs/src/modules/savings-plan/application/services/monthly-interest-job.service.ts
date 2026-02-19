import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
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
import { SavingsPlanStatus } from '../../domain/enums/plan-status.enum';
import { InterestCalculatorService } from './interest-calculator.service';

function generateReferenceNumber(): string {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

/**
 * Runs monthly: credits interest to SAVINGS accounts, FD/RD plans, processes RD installments and maturities.
 */
@Injectable()
export class MonthlyInterestJobService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(SAVINGS_PLAN_REPOSITORY_PORT)
    private readonly savingsPlanRepository: SavingsPlanRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly uow: UnitOfWorkPort,
    private readonly interestCalculator: InterestCalculatorService,
  ) {}

  /** Run on the first day of every month at 00:00. */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async runMonthlyInterestJob(): Promise<void> {
    const now = new Date();
    await this.processMaturities(now);
    await this.processSavingsAccountInterest(now);
    await this.processFixedDepositInterest(now);
    await this.processRecurringDepositInstallmentsAndInterest(now);
  }

  /** Manual trigger for testing (e.g. POST /v1/savings-plans/run-monthly-interest). */
  async runNow(): Promise<{ message: string }> {
    await this.runMonthlyInterestJob();
    return { message: 'Monthly interest job completed.' };
  }

  private async processMaturities(asOf: Date): Promise<void> {
    const matured = await this.savingsPlanRepository.findPlansMaturedBy(asOf);
    for (const plan of matured) {
      try {
        await this.uow.withTransaction(async (tx) => {
          const accountRepo = this.accountRepository.withTx(tx);
          const txRepo = this.transactionRepository.withTx(tx);
          const planRepo = this.savingsPlanRepository.withTx(tx);

          const sourceAccount = await accountRepo.findById(plan.sourceAccountId);
          if (!sourceAccount || !sourceAccount.isActive()) return;

          const payout = plan.getCurrentValue();
          if (payout <= 0) {
            await planRepo.update(plan.withStatus(SavingsPlanStatus.MATURED));
            return;
          }

          sourceAccount.deposit(payout);
          await accountRepo.update(sourceAccount);

          const depositTx = new Transaction(
            0,
            plan.sourceAccountId,
            TransactionType.DEPOSIT,
            payout,
            sourceAccount.getBalance(),
            `Savings plan matured - Plan #${plan.id} (${plan.planType})`,
            generateReferenceNumber(),
            null,
            null,
            null,
            asOf,
          );
          await txRepo.save(depositTx);

          await planRepo.update(plan.withStatus(SavingsPlanStatus.MATURED));
        });
      } catch (err) {
        // Log and continue with next plan
        console.error(`MonthlyInterestJob: maturity failed for plan ${plan.id}`, err);
      }
    }
  }

  private async processSavingsAccountInterest(asOf: Date): Promise<void> {
    const eligible = await this.accountRepository.findSavingsAccountsEligibleForMonthlyInterest(asOf);
    const rate = (a: { interestRate: number | null }) => (a.interestRate != null ? a.interestRate : 0);

    for (const account of eligible) {
      const annualRate = rate(account);
      if (annualRate <= 0) continue;

      try {
        await this.uow.withTransaction(async (tx) => {
          const accountRepo = this.accountRepository.withTx(tx);
          const txRepo = this.transactionRepository.withTx(tx);

          const acc = await accountRepo.findById(account.id);
          if (!acc || !acc.isActive() || rate(acc) <= 0) return;

          const interest = this.interestCalculator.calculateMonthlyInterest(acc.getBalance(), annualRate);
          if (interest <= 0) return;

          acc.deposit(interest);
          await accountRepo.updateBalanceAndLastInterestCreditedAt(
            acc.id,
            acc.getBalance(),
            acc.getAvailableBalance(),
            asOf,
          );

          const txEntity = new Transaction(
            0,
            acc.id,
            TransactionType.INTEREST_CREDIT,
            interest,
            acc.getBalance(),
            'Monthly interest',
            generateReferenceNumber(),
            null,
            null,
            null,
            asOf,
          );
          await txRepo.save(txEntity);
        });
      } catch (err) {
        console.error(`MonthlyInterestJob: SAVINGS interest failed for account ${account.id}`, err);
      }
    }
  }

  private async processFixedDepositInterest(asOf: Date): Promise<void> {
    const active = await this.savingsPlanRepository.findActivePlansForInterestRun();
    const fdPlans = active.filter((p) => p.isFixedDeposit() && p.principal != null);

    for (const plan of fdPlans) {
      try {
        const principal = plan.principal!;
        const interest = this.interestCalculator.calculateMonthlyInterest(principal, plan.interestRate);
        if (interest <= 0) continue;

        const updated = plan.withInterestCredited(interest, asOf);
        await this.savingsPlanRepository.update(updated);
      } catch (err) {
        console.error(`MonthlyInterestJob: FD interest failed for plan ${plan.id}`, err);
      }
    }
  }

  private async processRecurringDepositInstallmentsAndInterest(asOf: Date): Promise<void> {
    const active = await this.savingsPlanRepository.findActivePlansForInterestRun();
    const rdPlans = active.filter((p) => p.isRecurringDeposit());

    for (const plan of rdPlans) {
      try {
        let current = plan;

        const monthlyAmount = plan.monthlyAmount ?? 0;
        if (plan.nextDueDate && plan.nextDueDate <= asOf && monthlyAmount > 0) {
          await this.uow.withTransaction(async (tx) => {
            const accountRepo = this.accountRepository.withTx(tx);
            const txRepo = this.transactionRepository.withTx(tx);
            const planRepo = this.savingsPlanRepository.withTx(tx);

            const sourceAccount = await accountRepo.findById(plan.sourceAccountId);
            if (!sourceAccount || !sourceAccount.canWithdraw(monthlyAmount)) return;

            sourceAccount.withdraw(monthlyAmount);
            await accountRepo.update(sourceAccount);

            const nextDue = addMonths(plan.nextDueDate!, 1);
            current = plan.withRecurringDepositAdded(monthlyAmount, nextDue);
            await planRepo.update(current);

            const withdrawalTx = new Transaction(
              0,
              plan.sourceAccountId,
              TransactionType.WITHDRAWAL,
              monthlyAmount,
              sourceAccount.getBalance(),
              `Recurring deposit - Plan #${plan.id}`,
              generateReferenceNumber(),
              null,
              null,
              null,
              asOf,
            );
            await txRepo.save(withdrawalTx);
          });
        }

        const interest = this.interestCalculator.calculateMonthlyInterest(current.totalDeposited, current.interestRate);
        if (interest > 0) {
          const withInterest = current.withInterestCredited(interest, asOf);
          await this.savingsPlanRepository.update(withInterest);
        }
      } catch (err) {
        console.error(`MonthlyInterestJob: RD failed for plan ${plan.id}`, err);
      }
    }
  }
}
