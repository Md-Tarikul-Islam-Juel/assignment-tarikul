import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Min } from 'class-validator';

export class CreateFixedDepositDto {
  @ApiProperty({ example: 7, description: 'Source account ID to debit the principal from' })
  @IsInt()
  sourceAccountId!: number;

  @ApiProperty({ example: 10000, description: 'Principal amount (one-time)' })
  @IsNumber()
  @Min(1)
  principal!: number;

  @ApiProperty({ example: 12, description: 'Term in months' })
  @IsInt()
  @Min(1)
  termMonths!: number;

  @ApiProperty({ example: 5.5, description: 'Annual interest rate (e.g. 5.5 for 5.5%)' })
  @IsNumber()
  @Min(0)
  interestRate!: number;
}

export class CreateRecurringDepositDto {
  @ApiProperty({ example: 7, description: 'Source account ID for monthly debits' })
  @IsInt()
  sourceAccountId!: number;

  @ApiProperty({ example: 500, description: 'Monthly installment amount' })
  @IsNumber()
  @Min(0.01)
  monthlyAmount!: number;

  @ApiProperty({ example: 12, description: 'Term in months' })
  @IsInt()
  @Min(1)
  termMonths!: number;

  @ApiProperty({ example: 5.5, description: 'Annual interest rate (e.g. 5.5 for 5.5%)' })
  @IsNumber()
  @Min(0)
  interestRate!: number;
}

export class ListSavingsPlansQueryDto {
  @ApiProperty({ enum: ['ACTIVE', 'MATURED', 'CLOSED'], required: false })
  status?: string;

  @ApiProperty({ enum: ['FIXED_DEPOSIT', 'RECURRING_DEPOSIT'], required: false })
  planType?: string;
}
