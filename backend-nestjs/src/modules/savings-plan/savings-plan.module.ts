import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { PlatformJwtModule } from '../../platform/jwt/jwt.module';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { SAVINGS_PLAN_REPOSITORY_PORT } from './application/di-tokens';
import { InterestCalculatorService } from './application/services/interest-calculator.service';
import { MonthlyInterestJobService } from './application/services/monthly-interest-job.service';
import { CreateFixedDepositUseCase } from './application/use-cases/create-fixed-deposit.use-case';
import { CreateRecurringDepositUseCase } from './application/use-cases/create-recurring-deposit.use-case';
import { ListSavingsPlansUseCase } from './application/use-cases/list-savings-plans.use-case';
import { GetSavingsPlanUseCase } from './application/use-cases/get-savings-plan.use-case';
import { SavingsPlanPrismaRepository } from './infrastructure/prisma/savings-plan.prisma.repository';
import { SavingsPlanController } from './interface/http/savings-plan.controller';

@Module({
  imports: [PrismaModule, PlatformJwtModule, AuthModule, AccountModule],
  controllers: [SavingsPlanController],
  providers: [
    InterestCalculatorService,
    MonthlyInterestJobService,
    CreateFixedDepositUseCase,
    CreateRecurringDepositUseCase,
    ListSavingsPlansUseCase,
    GetSavingsPlanUseCase,
    {
      provide: SAVINGS_PLAN_REPOSITORY_PORT,
      useClass: SavingsPlanPrismaRepository,
    },
    SavingsPlanPrismaRepository,
  ],
  exports: [InterestCalculatorService, CreateFixedDepositUseCase, CreateRecurringDepositUseCase, ListSavingsPlansUseCase, GetSavingsPlanUseCase],
})
export class SavingsPlanModule {}
