import { AccountType } from '../../domain/enums/account-type.enum';
import { Currency } from '../../domain/enums/currency.enum';
import { AccountStatus } from '../../domain/enums/account-status.enum';

export interface CreateAccountInput {
  userId: number;
  type: AccountType;
  currency: Currency;
  interestRate?: number;
  minimumBalance?: number;
  // Loan-specific
  loanAmount?: number;
  loanTermMonths?: number;
}

export interface UpdateAccountInput {
  status?: AccountStatus;
  interestRate?: number;
  minimumBalance?: number;
}

export interface AccountFilters {
  userId?: number;
  type?: AccountType;
  status?: AccountStatus;
  limit?: number;
  offset?: number;
}
