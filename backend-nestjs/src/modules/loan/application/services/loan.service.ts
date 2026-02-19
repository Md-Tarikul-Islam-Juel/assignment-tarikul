import { Injectable } from '@nestjs/common';
import { LoanApplication } from '../../domain/entities/loan-application.entity';
import { ApplyLoanUseCase } from '../use-cases/apply-loan.use-case';
import { ListLoanApplicationsUseCase } from '../use-cases/list-loan-applications.use-case';
import { GetLoanApplicationUseCase } from '../use-cases/get-loan-application.use-case';
import { ApproveLoanUseCase } from '../use-cases/approve-loan.use-case';
import { RejectLoanUseCase } from '../use-cases/reject-loan.use-case';
import { GetRepaymentScheduleUseCase, RepaymentScheduleItem } from '../use-cases/get-repayment-schedule.use-case';
import { PayLoanRepaymentUseCase } from '../use-cases/pay-loan-repayment.use-case';
import { LoanType } from '../../domain/enums/loan-type.enum';
import { LoanApplicationStatus } from '../../domain/enums/loan-application-status.enum';
import { Currency } from '../../../account/domain/enums/currency.enum';

export interface ApplyLoanParams {
  userId: number;
  loanType: LoanType;
  amount: number;
  termMonths: number;
  purpose?: string;
  currency?: Currency;
  penaltyRatePercentPerMonth?: number;
}

export interface ListLoanApplicationsParams {
  userId?: number;
  status?: LoanApplicationStatus;
  limit?: number;
  offset?: number;
}

@Injectable()
export class LoanService {
  constructor(
    private readonly applyLoanUseCase: ApplyLoanUseCase,
    private readonly listLoanApplicationsUseCase: ListLoanApplicationsUseCase,
    private readonly getLoanApplicationUseCase: GetLoanApplicationUseCase,
    private readonly approveLoanUseCase: ApproveLoanUseCase,
    private readonly rejectLoanUseCase: RejectLoanUseCase,
    private readonly getRepaymentScheduleUseCase: GetRepaymentScheduleUseCase,
    private readonly payLoanRepaymentUseCase: PayLoanRepaymentUseCase,
  ) {}

  async applyLoan(params: ApplyLoanParams): Promise<LoanApplication> {
    return this.applyLoanUseCase.execute({
      userId: params.userId,
      loanType: params.loanType,
      amount: params.amount,
      termMonths: params.termMonths,
      purpose: params.purpose,
      currency: params.currency,
      penaltyRatePercentPerMonth: params.penaltyRatePercentPerMonth,
    });
  }

  async listForCustomer(customerId: number, params: { status?: LoanApplicationStatus; limit?: number; offset?: number }) {
    return this.listLoanApplicationsUseCase.executeForCustomer(customerId, {
      status: params.status,
      limit: params.limit,
      offset: params.offset,
    });
  }

  async listForStaff(params: ListLoanApplicationsParams) {
    return this.listLoanApplicationsUseCase.executeForStaff({
      userId: params.userId,
      status: params.status,
      limit: params.limit,
      offset: params.offset,
    });
  }

  async getApplication(applicationId: number, userId?: number): Promise<LoanApplication> {
    return this.getLoanApplicationUseCase.execute(applicationId, userId);
  }

  async approve(applicationId: number, decidedByUserId: number, interestRate: number): Promise<LoanApplication> {
    return this.approveLoanUseCase.execute(applicationId, decidedByUserId, interestRate);
  }

  async reject(applicationId: number, decidedByUserId: number, rejectionReason?: string): Promise<LoanApplication> {
    return this.rejectLoanUseCase.execute(applicationId, decidedByUserId, rejectionReason);
  }

  async getRepaymentSchedule(applicationId: number, userId?: number): Promise<RepaymentScheduleItem[]> {
    return this.getRepaymentScheduleUseCase.execute(applicationId, userId);
  }

  async payRepayment(repaymentId: number, fromAccountId: number, userId: number) {
    return this.payLoanRepaymentUseCase.execute(repaymentId, fromAccountId, userId);
  }
}
