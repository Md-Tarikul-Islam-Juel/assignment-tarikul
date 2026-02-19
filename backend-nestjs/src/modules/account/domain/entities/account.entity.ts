import { AccountNumber } from '../value-objects/account-number.vo';
import { AccountStatus } from '../enums/account-status.enum';
import { AccountType } from '../enums/account-type.enum';
import { Currency } from '../enums/currency.enum';

export class Account {
  constructor(
    public readonly id: number,
    public readonly accountNumber: AccountNumber,
    public readonly userId: number,
    public readonly type: AccountType,
    public readonly currency: Currency,
    private balance: number,
    private availableBalance: number,
    private status: AccountStatus,
    public readonly interestRate: number | null,
    public readonly minimumBalance: number | null,
    // Loan-specific fields
    public readonly loanAmount: number | null,
    public readonly loanTermMonths: number | null,
    public readonly loanStartDate: Date | null,
    public readonly loanEndDate: Date | null,
    public readonly monthlyPayment: number | null,
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly dailyWithdrawalLimit: number | null = null,
    public readonly transferFeePercent: number | null = null,
    public readonly transferFeeFixed: number | null = null,
    public readonly lastInterestCreditedAt: Date | null = null
  ) {}

  getBalance(): number {
    return this.balance;
  }

  getAvailableBalance(): number {
    return this.availableBalance;
  }

  getStatus(): AccountStatus {
    return this.status;
  }

  isActive(): boolean {
    return this.status === AccountStatus.ACTIVE;
  }

  isClosed(): boolean {
    return this.status === AccountStatus.CLOSED;
  }

  isFrozen(): boolean {
    return this.status === AccountStatus.FROZEN;
  }

  isLoanAccount(): boolean {
    return this.type === AccountType.LOAN;
  }

  canWithdraw(amount: number): boolean {
    if (!this.isActive()) {
      return false;
    }
    if (this.isLoanAccount()) {
      return false; // Loan accounts cannot withdraw
    }
    return this.availableBalance >= amount;
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }
    if (this.isClosed()) {
      throw new Error('Cannot deposit to a closed account');
    }
    this.balance += amount;
    this.availableBalance += amount;
  }

  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }
    if (!this.canWithdraw(amount)) {
      throw new Error('Insufficient balance or account not active');
    }
    this.balance -= amount;
    this.availableBalance -= amount;
  }

  freeze(): Account {
    return new Account(
      this.id,
      this.accountNumber,
      this.userId,
      this.type,
      this.currency,
      this.balance,
      this.availableBalance,
      AccountStatus.FROZEN,
      this.interestRate,
      this.minimumBalance,
      this.loanAmount,
      this.loanTermMonths,
      this.loanStartDate,
      this.loanEndDate,
      this.monthlyPayment,
      this.deletedAt,
      this.createdAt,
      this.updatedAt,
      this.dailyWithdrawalLimit,
      this.transferFeePercent,
      this.transferFeeFixed,
      this.lastInterestCreditedAt
    );
  }

  unfreeze(): Account {
    return new Account(
      this.id,
      this.accountNumber,
      this.userId,
      this.type,
      this.currency,
      this.balance,
      this.availableBalance,
      AccountStatus.ACTIVE,
      this.interestRate,
      this.minimumBalance,
      this.loanAmount,
      this.loanTermMonths,
      this.loanStartDate,
      this.loanEndDate,
      this.monthlyPayment,
      this.deletedAt,
      this.createdAt,
      this.updatedAt,
      this.dailyWithdrawalLimit,
      this.transferFeePercent,
      this.transferFeeFixed,
      this.lastInterestCreditedAt
    );
  }

  close(): Account {
    if (this.balance !== 0) {
      throw new Error('Cannot close account with non-zero balance');
    }
    return new Account(
      this.id,
      this.accountNumber,
      this.userId,
      this.type,
      this.currency,
      this.balance,
      this.availableBalance,
      AccountStatus.CLOSED,
      this.interestRate,
      this.minimumBalance,
      this.loanAmount,
      this.loanTermMonths,
      this.loanStartDate,
      this.loanEndDate,
      this.monthlyPayment,
      this.deletedAt,
      this.createdAt,
      this.updatedAt,
      this.dailyWithdrawalLimit,
      this.transferFeePercent,
      this.transferFeeFixed,
      this.lastInterestCreditedAt
    );
  }

  isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
