import { Prisma } from '@prisma/client';
import { SavingsPlan } from '../entities/savings-plan.entity';
import { SavingsPlanStatus } from '../enums/plan-status.enum';
import { SavingsPlanType } from '../enums/plan-type.enum';

export interface SavingsPlanRepositoryPort {
  findById(id: number): Promise<SavingsPlan | null>;
  findByUserId(userId: number, filters?: { status?: SavingsPlanStatus; planType?: SavingsPlanType }): Promise<SavingsPlan[]>;
  save(plan: SavingsPlan): Promise<SavingsPlan>;
  update(plan: SavingsPlan): Promise<SavingsPlan>;
  findActivePlansForInterestRun(): Promise<SavingsPlan[]>;
  findPlansMaturedBy(date: Date): Promise<SavingsPlan[]>;

  withTx(tx: Prisma.TransactionClient): SavingsPlanRepositoryPort;
}
