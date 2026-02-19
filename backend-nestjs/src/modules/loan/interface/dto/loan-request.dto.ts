import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { LoanType } from '../../domain/enums/loan-type.enum';
import { Currency } from '../../../account/domain/enums/currency.enum';

export class ApplyLoanDto {
  @ApiProperty({ enum: LoanType, example: LoanType.PERSONAL })
  @IsEnum(LoanType)
  loanType!: LoanType;

  @ApiProperty({ example: 10000, minimum: 1 })
  @IsNumber()
  @Min(1)
  amount!: number;

  @ApiProperty({ example: 12, minimum: 1, maximum: 360 })
  @IsNumber()
  @Min(1)
  @Max(360)
  termMonths!: number;

  @ApiProperty({ example: 'Home renovation', required: false })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiProperty({ enum: Currency, required: false })
  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @ApiProperty({ example: 1, description: 'Penalty % per month overdue', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  penaltyRatePercentPerMonth?: number;
}

export class ApproveLoanDto {
  @ApiProperty({ example: 5.5, minimum: 0, maximum: 100, description: 'Interest rate (% per year) - set by admin/employee' })
  @IsNumber()
  @Min(0)
  @Max(100)
  interestRate!: number;
}

export class RejectLoanDto {
  @ApiProperty({ example: 'Insufficient credit history', required: false })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class PayLoanRepaymentDto {
  @ApiProperty({ example: 1, description: 'Account ID to debit (customer’s checking/savings)' })
  @IsNumber()
  fromAccountId!: number;
}
