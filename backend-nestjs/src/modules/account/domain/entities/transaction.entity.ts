import { TransactionType } from '../enums/transaction-type.enum';

export class Transaction {
  constructor(
    public readonly id: number,
    public readonly accountId: number,
    public readonly type: TransactionType,
    public readonly amount: number,
    public readonly balanceAfter: number,
    public readonly description: string | null,
    public readonly referenceNumber: string | null,
    public readonly relatedAccountId: number | null,
    public readonly relatedTransactionId: number | null,
    public readonly metadata: Record<string, unknown> | null,
    public readonly createdAt: Date
  ) {}

  isDeposit(): boolean {
    return this.type === TransactionType.DEPOSIT || this.type === TransactionType.TRANSFER_IN;
  }

  isWithdrawal(): boolean {
    return this.type === TransactionType.WITHDRAWAL || this.type === TransactionType.TRANSFER_OUT;
  }

  isTransfer(): boolean {
    return this.type === TransactionType.TRANSFER_IN || this.type === TransactionType.TRANSFER_OUT;
  }
}
