import { SavingsPlanType } from '../enums/plan-type.enum';
import { SavingsPlanStatus } from '../enums/plan-status.enum';
import { Currency } from '../../../account/domain/enums/currency.enum';

export class SavingsPlan {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly sourceAccountId: number,
    public readonly planType: SavingsPlanType,
    public readonly currency: Currency,
    public readonly principal: number | null,
    public readonly monthlyAmount: number | null,
    public readonly interestRate: number,
    public readonly termMonths: number,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly status: SavingsPlanStatus,
    public readonly interestCreditedTotal: number,
    public readonly lastInterestCreditedAt: Date | null,
    public readonly totalDeposited: number,
    public readonly nextDueDate: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  isActive(): boolean {
    return this.status === SavingsPlanStatus.ACTIVE;
  }

  isFixedDeposit(): boolean {
    return this.planType === SavingsPlanType.FIXED_DEPOSIT;
  }

  isRecurringDeposit(): boolean {
    return this.planType === SavingsPlanType.RECURRING_DEPOSIT;
  }

  /** Current value: for FD = principal + interestCreditedTotal; for RD = totalDeposited + interestCreditedTotal */
  getCurrentValue(): number {
    if (this.isFixedDeposit() && this.principal != null) {
      return this.principal + this.interestCreditedTotal;
    }
    return this.totalDeposited + this.interestCreditedTotal;
  }

  /** New plan with additional interest credited (FD or RD). */
  withInterestCredited(additionalInterest: number, creditedAt: Date): SavingsPlan {
    return new SavingsPlan(
      this.id,
      this.userId,
      this.sourceAccountId,
      this.planType,
      this.currency,
      this.principal,
      this.monthlyAmount,
      this.interestRate,
      this.termMonths,
      this.startDate,
      this.endDate,
      this.status,
      this.interestCreditedTotal + additionalInterest,
      creditedAt,
      this.totalDeposited,
      this.nextDueDate,
      this.createdAt,
      new Date(),
    );
  }

  /** New plan with updated totalDeposited and nextDueDate (RD installment). */
  withRecurringDepositAdded(installmentAmount: number, nextDue: Date): SavingsPlan {
    return new SavingsPlan(
      this.id,
      this.userId,
      this.sourceAccountId,
      this.planType,
      this.currency,
      this.principal,
      this.monthlyAmount,
      this.interestRate,
      this.termMonths,
      this.startDate,
      this.endDate,
      this.status,
      this.interestCreditedTotal,
      this.lastInterestCreditedAt,
      this.totalDeposited + installmentAmount,
      nextDue,
      this.createdAt,
      new Date(),
    );
  }

  /** New plan with status updated (e.g. to MATURED). */
  withStatus(newStatus: SavingsPlanStatus): SavingsPlan {
    return new SavingsPlan(
      this.id,
      this.userId,
      this.sourceAccountId,
      this.planType,
      this.currency,
      this.principal,
      this.monthlyAmount,
      this.interestRate,
      this.termMonths,
      this.startDate,
      this.endDate,
      newStatus,
      this.interestCreditedTotal,
      this.lastInterestCreditedAt,
      this.totalDeposited,
      this.nextDueDate,
      this.createdAt,
      new Date(),
    );
  }
}
