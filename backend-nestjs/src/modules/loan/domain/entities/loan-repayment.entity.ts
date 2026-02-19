import { RepaymentStatus } from '../enums/repayment-status.enum';

export class LoanRepayment {
  constructor(
    public readonly id: number,
    public readonly loanApplicationId: number,
    public readonly installmentNumber: number,
    public readonly dueDate: Date,
    public readonly principalAmount: number,
    public readonly interestAmount: number,
    public readonly penaltyAmount: number,
    public readonly totalAmount: number,
    public readonly paidAt: Date | null,
    public readonly status: RepaymentStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  isOverdue(now: Date = new Date()): boolean {
    return this.status === RepaymentStatus.PENDING && this.dueDate < now;
  }
}
