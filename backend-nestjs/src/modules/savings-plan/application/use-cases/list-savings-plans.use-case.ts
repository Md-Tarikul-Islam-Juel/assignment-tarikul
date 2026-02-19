import { Inject, Injectable } from '@nestjs/common';
import { SavingsPlanRepositoryPort } from '../../domain/repositories/savings-plan.repository.port';
import { SAVINGS_PLAN_REPOSITORY_PORT } from '../di-tokens';
import { SavingsPlan } from '../../domain/entities/savings-plan.entity';
import { SavingsPlanStatus } from '../../domain/enums/plan-status.enum';
import { SavingsPlanType } from '../../domain/enums/plan-type.enum';

@Injectable()
export class ListSavingsPlansUseCase {
  constructor(
    @Inject(SAVINGS_PLAN_REPOSITORY_PORT)
    private readonly savingsPlanRepository: SavingsPlanRepositoryPort,
  ) {}

  async execute(
    userId: number,
    filters?: { status?: SavingsPlanStatus; planType?: SavingsPlanType },
  ): Promise<SavingsPlan[]> {
    return this.savingsPlanRepository.findByUserId(userId, filters);
  }
}
