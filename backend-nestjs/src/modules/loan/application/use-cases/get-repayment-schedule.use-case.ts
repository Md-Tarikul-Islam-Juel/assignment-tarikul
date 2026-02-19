import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LoanApplicationRepositoryPort, LoanRepaymentRepositoryPort } from '../../domain/repositories/loan.repository.port';
import { LOAN_APPLICATION_REPOSITORY_PORT, LOAN_REPAYMENT_REPOSITORY_PORT } from '../di-tokens';
import { LoanRepayment } from '../../domain/entities/loan-repayment.entity';
import { RepaymentStatus } from '../../domain/enums/repayment-status.enum';

export interface RepaymentScheduleItem {
  id: number;
  loanApplicationId: number;
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  totalAmount: number;
  paidAt: Date | null;
  status: RepaymentStatus;
}

@Injectable()
export class GetRepaymentScheduleUseCase {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY_PORT)
    private readonly loanApplicationRepository: LoanApplicationRepositoryPort,
    @Inject(LOAN_REPAYMENT_REPOSITORY_PORT)
    private readonly loanRepaymentRepository: LoanRepaymentRepositoryPort,
  ) {}

  async execute(applicationId: number, userId?: number): Promise<RepaymentScheduleItem[]> {
    const application = await this.loanApplicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }
    if (userId != null && application.userId !== userId) {
      throw new NotFoundException('Loan application not found');
    }
    if (!application.isApproved()) {
      throw new NotFoundException('Repayment schedule is only available for approved loans');
    }

    let repayments = await this.loanRepaymentRepository.findByLoanApplicationId(applicationId);
    const now = new Date();
    const penaltyRate = application.penaltyRatePercentPerMonth ?? 1;

    for (const r of repayments) {
      if (r.status === RepaymentStatus.PENDING && r.dueDate < now) {
        const monthsOverdue = Math.ceil((now.getTime() - r.dueDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
        const penaltyAmount = Math.round((r.principalAmount * (penaltyRate / 100) * Math.max(1, monthsOverdue)) * 100) / 100;
        const totalAmount = Math.round((r.principalAmount + r.interestAmount + penaltyAmount) * 100) / 100;
        const updated = new LoanRepayment(
          r.id,
          r.loanApplicationId,
          r.installmentNumber,
          r.dueDate,
          r.principalAmount,
          r.interestAmount,
          penaltyAmount,
          totalAmount,
          null,
          RepaymentStatus.OVERDUE,
          r.createdAt,
          new Date(),
        );
        await this.loanRepaymentRepository.update(updated);
      }
    }

    repayments = await this.loanRepaymentRepository.findByLoanApplicationId(applicationId);
    return repayments.map((r) => ({
      id: r.id,
      loanApplicationId: r.loanApplicationId,
      installmentNumber: r.installmentNumber,
      dueDate: r.dueDate,
      principalAmount: r.principalAmount,
      interestAmount: r.interestAmount,
      penaltyAmount: r.penaltyAmount,
      totalAmount: r.totalAmount,
      paidAt: r.paidAt,
      status: r.status,
    }));
  }
}
