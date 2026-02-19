import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { AccountModule } from './modules/account/account.module';
import { LoanModule } from './modules/loan/loan.module';
import { SavingsPlanModule } from './modules/savings-plan/savings-plan.module';
import { ReportModule } from './modules/report/report.module';

@Module({
  imports: [AuthModule, AccountModule, LoanModule, SavingsPlanModule, ReportModule]
})
export class AppHttpModule { }
