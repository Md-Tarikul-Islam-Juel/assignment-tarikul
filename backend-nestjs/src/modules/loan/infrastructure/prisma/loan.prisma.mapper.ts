import { LoanApplication as PrismaLoanApplication, LoanRepayment as PrismaLoanRepayment, Prisma } from '@prisma/client';
import { LoanApplication } from '../../domain/entities/loan-application.entity';
import { LoanRepayment } from '../../domain/entities/loan-repayment.entity';
import { LoanType } from '../../domain/enums/loan-type.enum';
import { LoanApplicationStatus } from '../../domain/enums/loan-application-status.enum';
import { RepaymentStatus } from '../../domain/enums/repayment-status.enum';
import { Currency } from '../../../account/domain/enums/currency.enum';

export class LoanPrismaMapper {
  static applicationToDomain(row: PrismaLoanApplication): LoanApplication {
    return new LoanApplication(
      row.id,
      row.userId,
      row.loanType as LoanType,
      Number(row.amount),
      row.termMonths,
      Number(row.interestRate),
      row.purpose,
      row.currency as Currency,
      row.status as LoanApplicationStatus,
      row.appliedAt,
      row.decidedAt,
      row.decidedByUserId,
      row.rejectionReason,
      row.accountId,
      row.penaltyRatePercentPerMonth != null ? Number(row.penaltyRatePercentPerMonth) : null,
      row.createdAt,
      row.updatedAt
    );
  }

  static applicationToPersistence(app: LoanApplication): Record<string, unknown> {
    return {
      id: app.id,
      userId: app.userId,
      loanType: app.loanType,
      amount: new Prisma.Decimal(app.amount),
      termMonths: app.termMonths,
      interestRate: new Prisma.Decimal(app.interestRate),
      purpose: app.purpose,
      currency: app.currency,
      status: app.status,
      appliedAt: app.appliedAt,
      decidedAt: app.decidedAt,
      decidedByUserId: app.decidedByUserId,
      rejectionReason: app.rejectionReason,
      accountId: app.accountId,
      penaltyRatePercentPerMonth: app.penaltyRatePercentPerMonth != null ? new Prisma.Decimal(app.penaltyRatePercentPerMonth) : null,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    };
  }

  static repaymentToDomain(row: PrismaLoanRepayment): LoanRepayment {
    const dueDate = typeof row.dueDate === 'string' ? new Date(row.dueDate) : row.dueDate;
    return new LoanRepayment(
      row.id,
      row.loanApplicationId,
      row.installmentNumber,
      dueDate,
      Number(row.principalAmount),
      Number(row.interestAmount),
      Number(row.penaltyAmount),
      Number(row.totalAmount),
      row.paidAt,
      row.status as RepaymentStatus,
      row.createdAt,
      row.updatedAt
    );
  }

  static repaymentToPersistence(rep: LoanRepayment): Record<string, unknown> {
    return {
      id: rep.id,
      loanApplicationId: rep.loanApplicationId,
      installmentNumber: rep.installmentNumber,
      dueDate: rep.dueDate,
      principalAmount: new Prisma.Decimal(rep.principalAmount),
      interestAmount: new Prisma.Decimal(rep.interestAmount),
      penaltyAmount: new Prisma.Decimal(rep.penaltyAmount),
      totalAmount: new Prisma.Decimal(rep.totalAmount),
      paidAt: rep.paidAt,
      status: rep.status,
      createdAt: rep.createdAt,
      updatedAt: rep.updatedAt,
    };
  }
}
