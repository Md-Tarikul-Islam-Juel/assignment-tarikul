import { Injectable } from '@nestjs/common';
import { LoanApplication } from '../../../loan/domain/entities/loan-application.entity';
import { LoanApplicationStatus } from '../../../loan/domain/enums/loan-application-status.enum';
import { LoanService } from '../../../loan/application/services/loan.service';
import { RepaymentStatus } from '../../../loan/domain/enums/repayment-status.enum';

export interface LoanBalanceItem {
  loanApplicationId: number;
  userId: number;
  loanType: string;
  currency: string;
  totalAmount: number;
  paidPrincipal: number;
  outstandingBalance: number;
  status: string;
  accountId: number | null;
  appliedAt: Date;
}

@Injectable()
export class GetLoanBalancesReportUseCase {
  constructor(private readonly loanService: LoanService) {}

  async executeForCustomer(userId: number): Promise<LoanBalanceItem[]> {
    const result = await this.loanService.listForCustomer(userId, {
      status: LoanApplicationStatus.APPROVED,
      limit: 100,
      offset: 0
    });
    return this.enrichWithBalances(result.applications);
  }

  async executeForStaff(userId?: number): Promise<LoanBalanceItem[]> {
    const result = await this.loanService.listForStaff({
      userId,
      status: LoanApplicationStatus.APPROVED,
      limit: 500,
      offset: 0
    });
    return this.enrichWithBalances(result.applications);
  }

  private async enrichWithBalances(applications: LoanApplication[]): Promise<LoanBalanceItem[]> {
    const items: LoanBalanceItem[] = [];
    for (const app of applications) {
      const schedule = await this.loanService.getRepaymentSchedule(app.id, undefined);
      const paidPrincipal = schedule
        .filter((r) => r.status === RepaymentStatus.PAID)
        .reduce((sum, r) => sum + r.principalAmount, 0);
      const outstandingBalance = Math.max(0, app.amount - paidPrincipal);
      items.push({
        loanApplicationId: app.id,
        userId: app.userId,
        loanType: app.loanType,
        currency: app.currency,
        totalAmount: app.amount,
        paidPrincipal,
        outstandingBalance,
        status: app.status,
        accountId: app.accountId,
        appliedAt: app.appliedAt
      });
    }
    return items;
  }
}
