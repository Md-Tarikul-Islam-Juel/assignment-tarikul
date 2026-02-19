import { SavingsPlan as PrismaPlan, Prisma } from '@prisma/client';
import { SavingsPlan } from '../../domain/entities/savings-plan.entity';
import { SavingsPlanType } from '../../domain/enums/plan-type.enum';
import { SavingsPlanStatus } from '../../domain/enums/plan-status.enum';
import { Currency } from '../../../account/domain/enums/currency.enum';

function toDate(d: Date | string | null): Date | null {
  if (!d) return null;
  return typeof d === 'string' ? new Date(d) : d;
}

export class SavingsPlanPrismaMapper {
  static toDomain(row: PrismaPlan): SavingsPlan {
    return new SavingsPlan(
      row.id,
      row.userId,
      row.sourceAccountId,
      row.planType as SavingsPlanType,
      row.currency as Currency,
      row.principal != null ? Number(row.principal) : null,
      row.monthlyAmount != null ? Number(row.monthlyAmount) : null,
      Number(row.interestRate),
      row.termMonths,
      toDate(row.startDate)!,
      toDate(row.endDate)!,
      row.status as SavingsPlanStatus,
      Number(row.interestCreditedTotal),
      row.lastInterestCreditedAt,
      Number(row.totalDeposited),
      toDate(row.nextDueDate),
      row.createdAt,
      row.updatedAt,
    );
  }

  static toPersistence(plan: SavingsPlan): Record<string, unknown> {
    return {
      id: plan.id,
      userId: plan.userId,
      sourceAccountId: plan.sourceAccountId,
      planType: plan.planType,
      currency: plan.currency,
      principal: plan.principal != null ? new Prisma.Decimal(plan.principal) : null,
      monthlyAmount: plan.monthlyAmount != null ? new Prisma.Decimal(plan.monthlyAmount) : null,
      interestRate: new Prisma.Decimal(plan.interestRate),
      termMonths: plan.termMonths,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status,
      interestCreditedTotal: new Prisma.Decimal(plan.interestCreditedTotal),
      lastInterestCreditedAt: plan.lastInterestCreditedAt,
      totalDeposited: new Prisma.Decimal(plan.totalDeposited),
      nextDueDate: plan.nextDueDate,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
