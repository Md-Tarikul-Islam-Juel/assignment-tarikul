export type AccountType = 'CHECKING' | 'SAVINGS' | 'LOAN';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'BDT' | 'INR' | 'JPY' | 'CNY' | 'AUD' | 'CAD';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED' | 'FROZEN';
export type TransactionType =
  | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER_IN' | 'TRANSFER_OUT'
  | 'INTEREST_CREDIT' | 'FEE' | 'LOAN_DISBURSEMENT' | 'LOAN_REPAYMENT';

export interface Account {
  id: number;
  accountNumber: string;
  userId: number;
  /** Owner email (included in list response only) */
  ownerEmail?: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  availableBalance: number;
  status: AccountStatus;
  interestRate: number | null;
  minimumBalance: number | null;
  loanAmount: number | null;
  loanTermMonths: number | null;
  loanStartDate: string | null;
  loanEndDate: string | null;
  monthlyPayment: number | null;
  dailyWithdrawalLimit?: number | null;
  transferFeePercent?: number | null;
  transferFeeFixed?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  accountId: number;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string | null;
  referenceNumber: string | null;
  relatedAccountId: number | null;
  relatedTransactionId: number | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateAccountRequest {
  /** Customer User ID. Provide either userId or customerEmail. */
  userId?: number;
  /** Customer email. Provide either customerEmail or userId (email is preferred). */
  customerEmail?: string;
  type: AccountType;
  currency?: Currency;
  interestRate?: number;
  minimumBalance?: number;
  loanAmount?: number;
  loanTermMonths?: number;
}

export interface UpdateAccountRequest {
  status?: AccountStatus;
  interestRate?: number;
  minimumBalance?: number;
  dailyWithdrawalLimit?: number;
  transferFeePercent?: number;
  transferFeeFixed?: number;
}

export interface AccountQueryParams {
  userId?: number;
  type?: AccountType;
  status?: AccountStatus;
  limit?: number;
  offset?: number;
}

export interface AccountHistoryQueryParams {
  type?: string;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

export interface ListAccountsResponse {
  success: boolean;
  data: Account[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetAccountResponse {
  success: boolean;
  data: Account;
}

export interface CreateAccountResponse {
  success: boolean;
  data: Account;
  message: string;
}

export interface AccountHistoryResponse {
  success: boolean;
  data: Transaction[];
  total: number;
}

export interface DepositRequest {
  amount: number;
  description?: string;
}

export interface WithdrawRequest {
  amount: number;
  description?: string;
}

export interface TransferRequest {
  toAccountNumber: string;
  amount: number;
  description?: string;
}

export interface DepositResponse {
  accountId: number;
  transactionId: number;
  balanceAfter: number;
}

export interface WithdrawResponse {
  accountId: number;
  transactionId: number;
  balanceAfter: number;
}

export interface TransferResponse {
  fromAccountId: number;
  toAccountId: number;
  referenceNumber: string;
  fee: number;
}
