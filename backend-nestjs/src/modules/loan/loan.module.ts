import { Module } from '@nestjs/common';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { PlatformJwtModule } from '../../platform/jwt/jwt.module';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { UNIT_OF_WORK_PORT } from '../../common/persistence/uow/di-tokens';
import { PrismaUnitOfWork } from '../auth/infrastructure/uow/prisma.uow';
import { LOAN_APPLICATION_REPOSITORY_PORT, LOAN_REPAYMENT_REPOSITORY_PORT } from './application/di-tokens';
import { LoanApplicationPrismaRepository, LoanRepaymentPrismaRepository } from './infrastructure/prisma/loan.prisma.repository';
import { LoanService } from './application/services/loan.service';
import { ApplyLoanUseCase } from './application/use-cases/apply-loan.use-case';
import { ListLoanApplicationsUseCase } from './application/use-cases/list-loan-applications.use-case';
import { GetLoanApplicationUseCase } from './application/use-cases/get-loan-application.use-case';
import { ApproveLoanUseCase } from './application/use-cases/approve-loan.use-case';
import { RejectLoanUseCase } from './application/use-cases/reject-loan.use-case';
import { GetRepaymentScheduleUseCase } from './application/use-cases/get-repayment-schedule.use-case';
import { PayLoanRepaymentUseCase } from './application/use-cases/pay-loan-repayment.use-case';
import { LoanController } from './interface/http/loan.controller';

@Module({
  imports: [PrismaModule, AuthModule, PlatformJwtModule, AccountModule],
  controllers: [LoanController],
  providers: [
    LoanService,
    ApplyLoanUseCase,
    ListLoanApplicationsUseCase,
    GetLoanApplicationUseCase,
    ApproveLoanUseCase,
    RejectLoanUseCase,
    GetRepaymentScheduleUseCase,
    PayLoanRepaymentUseCase,
    {
      provide: LOAN_APPLICATION_REPOSITORY_PORT,
      useClass: LoanApplicationPrismaRepository,
    },
    LoanApplicationPrismaRepository,
    {
      provide: LOAN_REPAYMENT_REPOSITORY_PORT,
      useClass: LoanRepaymentPrismaRepository,
    },
    LoanRepaymentPrismaRepository,
    {
      provide: UNIT_OF_WORK_PORT,
      useClass: PrismaUnitOfWork,
    },
    PrismaUnitOfWork,
  ],
  exports: [LoanService],
})
export class LoanModule {}
