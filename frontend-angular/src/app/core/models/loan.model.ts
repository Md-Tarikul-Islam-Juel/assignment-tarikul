export type LoanType = 'PERSONAL' | 'HOME' | 'AUTO' | 'EDUCATION' | 'BUSINESS';
export type LoanApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RepaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface LoanApplication {
  id: number;
  userId: number;
  loanType: LoanType;
  amount: number;
  termMonths: number;
  interestRate: number;
  purpose?: string | null;
  currency: string;
  status: LoanApplicationStatus;
  appliedAt: string;
  decidedAt?: string | null;
  decidedByUserId?: number | null;
  rejectionReason?: string | null;
  accountId?: number | null;
  penaltyRatePercentPerMonth?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoanRepaymentScheduleItem {
  id: number;
  loanApplicationId: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  totalAmount: number;
  paidAt?: string | null;
  status: RepaymentStatus;
}

export interface ApplyLoanRequest {
  loanType: LoanType;
  amount: number;
  termMonths: number;
  purpose?: string;
  currency?: string;
  penaltyRatePercentPerMonth?: number;
}

export interface ListLoanApplicationsResponse {
  success: boolean;
  data: LoanApplication[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetLoanApplicationResponse {
  success: boolean;
  data: LoanApplication;
}

export interface GetRepaymentScheduleResponse {
  success: boolean;
  data: LoanRepaymentScheduleItem[];
}
