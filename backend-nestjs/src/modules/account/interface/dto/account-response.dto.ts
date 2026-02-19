import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '../../domain/enums/account-type.enum';
import { Currency } from '../../domain/enums/currency.enum';
import { AccountStatus } from '../../domain/enums/account-status.enum';
import { TransactionType } from '../../domain/enums/transaction-type.enum';

export class AccountDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'ACCT12345678901234' })
  accountNumber!: string;

  @ApiProperty({ example: 1 })
  userId!: number;

  @ApiProperty({ example: 'customer@example.com', description: 'Owner email (included in list only)', required: false })
  ownerEmail?: string;

  @ApiProperty({ enum: AccountType })
  type!: AccountType;

  @ApiProperty({ enum: Currency })
  currency!: Currency;

  @ApiProperty({ example: 1000.50 })
  balance!: number;

  @ApiProperty({ example: 950.50 })
  availableBalance!: number;

  @ApiProperty({ enum: AccountStatus })
  status!: AccountStatus;

  @ApiProperty({ example: 2.5, nullable: true })
  interestRate!: number | null;

  @ApiProperty({ example: 100, nullable: true })
  minimumBalance!: number | null;

  @ApiProperty({ example: 10000, nullable: true })
  loanAmount!: number | null;

  @ApiProperty({ example: 12, nullable: true })
  loanTermMonths!: number | null;

  @ApiProperty({ nullable: true })
  loanStartDate!: Date | null;

  @ApiProperty({ nullable: true })
  loanEndDate!: Date | null;

  @ApiProperty({ example: 833.33, nullable: true })
  monthlyPayment!: number | null;

  @ApiProperty({ example: 5000, nullable: true, description: 'Daily withdrawal/transfer limit' })
  dailyWithdrawalLimit!: number | null;

  @ApiProperty({ example: 0.5, nullable: true, description: 'Transfer fee percent' })
  transferFeePercent!: number | null;

  @ApiProperty({ example: 1.5, nullable: true, description: 'Fixed transfer fee' })
  transferFeeFixed!: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TransactionDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  accountId!: number;

  @ApiProperty({ enum: TransactionType })
  type!: TransactionType;

  @ApiProperty({ example: 100.50 })
  amount!: number;

  @ApiProperty({ example: 1100.00 })
  balanceAfter!: number;

  @ApiProperty({ example: 'Deposit', nullable: true })
  description!: string | null;

  @ApiProperty({ example: 'REF123456', nullable: true })
  referenceNumber!: string | null;

  @ApiProperty({ example: 2, nullable: true })
  relatedAccountId!: number | null;

  @ApiProperty({ example: 3, nullable: true })
  relatedTransactionId!: number | null;

  @ApiProperty({ nullable: true })
  metadata!: Record<string, unknown> | null;

  @ApiProperty()
  createdAt!: Date;
}

export class CreateAccountResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty({ type: AccountDto })
  data!: AccountDto;

  @ApiProperty()
  message!: string;
}

export class GetAccountResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty({ type: AccountDto })
  data!: AccountDto;
}

export class ListAccountsResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty({ type: [AccountDto] })
  data!: AccountDto[];

  @ApiProperty({ description: 'Total number of accounts matching the filter' })
  total!: number;

  @ApiProperty({ description: 'Limit (page size) used for this request' })
  limit!: number;

  @ApiProperty({ description: 'Offset used for this request' })
  offset!: number;
}

export class AccountHistoryResponseDto {
  @ApiProperty()
  success!: boolean;

  @ApiProperty({ type: [TransactionDto] })
  data!: TransactionDto[];

  @ApiProperty()
  total!: number;
}
