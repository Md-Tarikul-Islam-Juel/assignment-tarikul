import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SavingsPlanRepositoryPort } from '../../domain/repositories/savings-plan.repository.port';
import { SAVINGS_PLAN_REPOSITORY_PORT } from '../di-tokens';
import { SavingsPlan } from '../../domain/entities/savings-plan.entity';

@Injectable()
export class GetSavingsPlanUseCase {
  constructor(
    @Inject(SAVINGS_PLAN_REPOSITORY_PORT)
    private readonly savingsPlanRepository: SavingsPlanRepositoryPort,
  ) {}

  async execute(planId: number, userId: number): Promise<SavingsPlan> {
    const plan = await this.savingsPlanRepository.findById(planId);
    if (!plan || plan.userId !== userId) {
      throw new NotFoundException('Savings plan not found');
    }
    return plan;
  }
}
