import { ApiProperty } from '@nestjs/swagger';
import { AccountDto, TransactionDto } from '../../../account/interface/dto/account-response.dto';

export class MonthlyStatementPeriodDto {
  @ApiProperty({ example: 2024 })
  year!: number;
  @ApiProperty({ example: 6 })
  month!: number;
  @ApiProperty()
  startDate!: Date;
  @ApiProperty()
  endDate!: Date;
}

export class MonthlyStatementResponseDto {
  @ApiProperty({ type: () => AccountDto })
  account!: AccountDto;
  @ApiProperty({ type: MonthlyStatementPeriodDto })
  period!: MonthlyStatementPeriodDto;
  @ApiProperty({ example: 1000.5, description: 'Balance at start of period' })
  openingBalance!: number;
  @ApiProperty({ type: [TransactionDto] })
  transactions!: TransactionDto[];
  @ApiProperty({ example: 1500.75, description: 'Balance at end of period' })
  closingBalance!: number;
}

export class AccountSummaryItemDto {
  @ApiProperty()
  id!: number;
  @ApiProperty()
  accountNumber!: string;
  @ApiProperty()
  type!: string;
  @ApiProperty()
  currency!: string;
  @ApiProperty()
  balance!: number;
  @ApiProperty()
  availableBalance!: number;
  @ApiProperty()
  status!: string;
  @ApiProperty({ required: false })
  ownerEmail?: string;
}

export class AccountSummaryReportResponseDto {
  @ApiProperty({ type: [AccountSummaryItemDto] })
  data!: AccountSummaryItemDto[];
  @ApiProperty()
  total!: number;
}

export class LoanBalanceItemDto {
  @ApiProperty()
  loanApplicationId!: number;
  @ApiProperty()
  userId!: number;
  @ApiProperty()
  loanType!: string;
  @ApiProperty()
  currency!: string;
  @ApiProperty()
  totalAmount!: number;
  @ApiProperty()
  paidPrincipal!: number;
  @ApiProperty()
  outstandingBalance!: number;
  @ApiProperty()
  status!: string;
  @ApiProperty({ nullable: true })
  accountId!: number | null;
  @ApiProperty()
  appliedAt!: Date;
}

export class LoanBalancesReportResponseDto {
  @ApiProperty({ type: [LoanBalanceItemDto] })
  data!: LoanBalanceItemDto[];
}

export class TransactionHistoryReportResponseDto {
  @ApiProperty({ type: [TransactionDto] })
  data!: TransactionDto[];
  @ApiProperty()
  total!: number;
}
