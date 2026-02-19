import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator';
import { AccountType } from '../../domain/enums/account-type.enum';
import { Currency } from '../../domain/enums/currency.enum';
import { AccountStatus } from '../../domain/enums/account-status.enum';

export class CreateAccountDto {
  @ApiProperty({ example: 2, description: 'Customer User ID. Provide either userId or customerEmail (email is preferred).', required: false })
  @ValidateIf((o) => !o.customerEmail)
  @IsNumber()
  userId?: number;

  @ApiProperty({ example: 'customer@example.com', description: 'Customer email - the customer for whom the account is created. Provide either customerEmail or userId.', required: false })
  @ValidateIf((o) => !o.userId)
  @IsEmail()
  @IsString()
  customerEmail?: string;

  @ApiProperty({ enum: AccountType, example: AccountType.CHECKING, description: 'Account type' })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiProperty({ enum: Currency, example: Currency.USD, description: 'Account currency', default: Currency.USD })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiProperty({ example: 2.5, description: 'Interest rate (for savings/loan accounts)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  interestRate?: number;

  @ApiProperty({ example: 100, description: 'Minimum balance requirement', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minimumBalance?: number;

  // Loan-specific fields
  @ApiProperty({ example: 10000, description: 'Loan amount (for loan accounts)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  loanAmount?: number;

  @ApiProperty({ example: 12, description: 'Loan term in months (for loan accounts)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(1)
  loanTermMonths?: number;
}

export class UpdateAccountDto {
  @ApiProperty({ enum: AccountStatus, example: AccountStatus.ACTIVE, description: 'Account status', required: false })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @ApiProperty({ example: 2.5, description: 'Interest rate', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  interestRate?: number;

  @ApiProperty({ example: 100, description: 'Minimum balance requirement', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minimumBalance?: number;

  @ApiProperty({ example: 5000, description: 'Daily withdrawal/transfer limit', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  dailyWithdrawalLimit?: number;

  @ApiProperty({ example: 0.5, description: 'Transfer fee percent (e.g. 0.5 for 0.5%)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  transferFeePercent?: number;

  @ApiProperty({ example: 1.5, description: 'Fixed transfer fee per transaction', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  transferFeeFixed?: number;
}

export class AccountQueryDto {
  @ApiProperty({ example: 1, description: 'User ID filter', required: false })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({ enum: AccountType, description: 'Account type filter', required: false })
  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @ApiProperty({ enum: AccountStatus, description: 'Account status filter', required: false })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @ApiProperty({ example: 10, description: 'Limit results', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: 0, description: 'Offset for pagination', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;
}

export class AccountHistoryQueryDto {
  @ApiProperty({ example: 'DEPOSIT', description: 'Transaction type filter', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 10, description: 'Limit results', required: false, default: 10 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: 0, description: 'Offset for pagination', required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;

  @ApiProperty({ example: '2024-01-01', description: 'Start date filter', required: false })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2024-12-31', description: 'End date filter', required: false })
  @IsString()
  @IsOptional()
  endDate?: string;
}

export class DepositDto {
  @ApiProperty({ example: 100.5, description: 'Amount to deposit' })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'Cash deposit', description: 'Optional description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class WithdrawDto {
  @ApiProperty({ example: 50.25, description: 'Amount to withdraw' })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'ATM withdrawal', description: 'Optional description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class TransferDto {
  @ApiProperty({ example: 'ACCT240117757258', description: 'Destination account number' })
  @IsString()
  toAccountNumber!: string;

  @ApiProperty({ example: 100, description: 'Amount to transfer' })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'Payment for services', description: 'Optional description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
