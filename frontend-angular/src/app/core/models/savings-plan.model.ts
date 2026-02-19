export type SavingsPlanType = 'FIXED_DEPOSIT' | 'RECURRING_DEPOSIT';
export type SavingsPlanStatus = 'ACTIVE' | 'MATURED' | 'CLOSED';

export interface SavingsPlan {
  id: number;
  userId: number;
  sourceAccountId: number;
  planType: SavingsPlanType;
  currency: string;
  principal: number | null;
  monthlyAmount: number | null;
  interestRate: number;
  termMonths: number;
  startDate: string;
  endDate: string;
  status: SavingsPlanStatus;
  interestCreditedTotal: number;
  lastInterestCreditedAt: string | null;
  totalDeposited: number;
  nextDueDate: string | null;
  currentValue: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFixedDepositRequest {
  sourceAccountId: number;
  principal: number;
  termMonths: number;
  interestRate: number;
}

export interface CreateRecurringDepositRequest {
  sourceAccountId: number;
  monthlyAmount: number;
  termMonths: number;
  interestRate: number;
}

export interface ListSavingsPlansResponse {
  data: SavingsPlan[];
}

export interface GetSavingsPlanResponse {
  data: SavingsPlan;
}

export interface RunMonthlyInterestResponse {
  message: string;
}
