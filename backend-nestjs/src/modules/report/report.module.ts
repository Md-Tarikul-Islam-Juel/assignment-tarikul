import { Module } from '@nestjs/common';
import { PlatformJwtModule } from '../../platform/jwt/jwt.module';
import { AuthModule } from '../auth/auth.module';
import { AccountModule } from '../account/account.module';
import { LoanModule } from '../loan/loan.module';
import { ReportController } from './interface/http/report.controller';
import { GetMonthlyStatementUseCase } from './application/use-cases/get-monthly-statement.use-case';
import { GetLoanBalancesReportUseCase } from './application/use-cases/get-loan-balances-report.use-case';

@Module({
  imports: [PlatformJwtModule, AuthModule, AccountModule, LoanModule],
  controllers: [ReportController],
  providers: [GetMonthlyStatementUseCase, GetLoanBalancesReportUseCase],
  exports: []
})
export class ReportModule {}
