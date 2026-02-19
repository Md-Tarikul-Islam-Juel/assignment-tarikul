import { Account } from '../../domain/entities/account.entity';
import { Transaction } from '../../domain/entities/transaction.entity';
import { AccountDto, TransactionDto } from '../../interface/dto/account-response.dto';

export class AccountMapper {
  static toDto(account: Account): AccountDto {
    return {
      id: account.id,
      accountNumber: account.accountNumber.getValue(),
      userId: account.userId,
      type: account.type,
      currency: account.currency,
      balance: account.getBalance(),
      availableBalance: account.getAvailableBalance(),
      status: account.getStatus(),
      interestRate: account.interestRate,
      minimumBalance: account.minimumBalance,
      loanAmount: account.loanAmount,
      loanTermMonths: account.loanTermMonths,
      loanStartDate: account.loanStartDate,
      loanEndDate: account.loanEndDate,
      monthlyPayment: account.monthlyPayment,
      dailyWithdrawalLimit: account.dailyWithdrawalLimit,
      transferFeePercent: account.transferFeePercent,
      transferFeeFixed: account.transferFeeFixed,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    };
  }

  static toTransactionDto(transaction: Transaction): TransactionDto {
    return {
      id: transaction.id,
      accountId: transaction.accountId,
      type: transaction.type,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      description: transaction.description,
      referenceNumber: transaction.referenceNumber,
      relatedAccountId: transaction.relatedAccountId,
      relatedTransactionId: transaction.relatedTransactionId,
      metadata: transaction.metadata,
      createdAt: transaction.createdAt
    };
  }
}
