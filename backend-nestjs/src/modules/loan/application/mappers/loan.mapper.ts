import { LoanApplication } from '../../domain/entities/loan-application.entity';
import { LoanApplicationResponseDto } from '../../interface/dto/loan-response.dto';
import { RepaymentScheduleItem } from '../use-cases/get-repayment-schedule.use-case';

export class LoanMapper {
  static toApplicationDto(app: LoanApplication): LoanApplicationResponseDto {
    return {
      id: app.id,
      userId: app.userId,
      loanType: app.loanType,
      amount: app.amount,
      termMonths: app.termMonths,
      interestRate: app.interestRate,
      purpose: app.purpose,
      currency: app.currency,
      status: app.status,
      appliedAt: app.appliedAt.toISOString(),
      decidedAt: app.decidedAt?.toISOString(),
      decidedByUserId: app.decidedByUserId,
      rejectionReason: app.rejectionReason,
      accountId: app.accountId,
      penaltyRatePercentPerMonth: app.penaltyRatePercentPerMonth,
      createdAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    };
  }

  static toRepaymentScheduleItemDto(item: RepaymentScheduleItem) {
    return {
      id: item.id,
      loanApplicationId: item.loanApplicationId,
      installmentNumber: item.installmentNumber,
      dueDate: typeof item.dueDate === 'string' ? item.dueDate : item.dueDate.toISOString().split('T')[0],
      principalAmount: item.principalAmount,
      interestAmount: item.interestAmount,
      penaltyAmount: item.penaltyAmount,
      totalAmount: item.totalAmount,
      paidAt: item.paidAt?.toISOString(),
      status: item.status,
    };
  }
}
