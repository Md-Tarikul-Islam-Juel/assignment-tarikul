import type { Account } from './account.model';
import type { Transaction } from './account.model';

export interface MonthlyStatementPeriod {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
}

export interface MonthlyStatementResponse {
  success: boolean;
  data: {
    account: Account;
    period: MonthlyStatementPeriod;
    openingBalance: number;
    transactions: Transaction[];
    closingBalance: number;
  };
}

export interface AccountSummaryItem {
  id: number;
  accountNumber: string;
  type: string;
  currency: string;
  balance: number;
  availableBalance: number;
  status: string;
  ownerEmail?: string;
}

export interface AccountSummaryReportResponse {
  success: boolean;
  data: AccountSummaryItem[];
  total: number;
}

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
  appliedAt: string;
}

export interface LoanBalancesReportResponse {
  success: boolean;
  data: LoanBalanceItem[];
}

export interface TransactionHistoryReportResponse {
  success: boolean;
  data: Transaction[];
  total: number;
}
