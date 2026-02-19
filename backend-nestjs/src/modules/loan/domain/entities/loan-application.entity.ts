import { LoanType } from '../enums/loan-type.enum';
import { LoanApplicationStatus } from '../enums/loan-application-status.enum';
import { Currency } from '../../../account/domain/enums/currency.enum';

export class LoanApplication {
  constructor(
    public readonly id: number,
    public readonly userId: number,
    public readonly loanType: LoanType,
    public readonly amount: number,
    public readonly termMonths: number,
    public readonly interestRate: number,
    public readonly purpose: string | null,
    public readonly currency: Currency,
    public readonly status: LoanApplicationStatus,
    public readonly appliedAt: Date,
    public readonly decidedAt: Date | null,
    public readonly decidedByUserId: number | null,
    public readonly rejectionReason: string | null,
    public readonly accountId: number | null,
    public readonly penaltyRatePercentPerMonth: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  isPending(): boolean {
    return this.status === LoanApplicationStatus.PENDING;
  }

  isApproved(): boolean {
    return this.status === LoanApplicationStatus.APPROVED;
  }

  isRejected(): boolean {
    return this.status === LoanApplicationStatus.REJECTED;
  }
}
