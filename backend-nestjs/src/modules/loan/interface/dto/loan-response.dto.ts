import { ApiProperty } from '@nestjs/swagger';

export class LoanApplicationResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty({ enum: ['PERSONAL', 'HOME', 'AUTO', 'EDUCATION', 'BUSINESS'] })
  loanType!: string;

  @ApiProperty()
  amount!: number;

  @ApiProperty()
  termMonths!: number;

  @ApiProperty()
  interestRate!: number;

  @ApiProperty({ required: false })
  purpose?: string | null;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
  status!: string;

  @ApiProperty()
  appliedAt!: string;

  @ApiProperty({ required: false })
  decidedAt?: string | null;

  @ApiProperty({ required: false })
  decidedByUserId?: number | null;

  @ApiProperty({ required: false })
  rejectionReason?: string | null;

  @ApiProperty({ required: false })
  accountId?: number | null;

  @ApiProperty({ required: false })
  penaltyRatePercentPerMonth?: number | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class LoanRepaymentScheduleItemDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  loanApplicationId!: number;

  @ApiProperty()
  installmentNumber!: number;

  @ApiProperty()
  dueDate!: string;

  @ApiProperty()
  principalAmount!: number;

  @ApiProperty()
  interestAmount!: number;

  @ApiProperty()
  penaltyAmount!: number;

  @ApiProperty()
  totalAmount!: number;

  @ApiProperty({ required: false })
  paidAt?: string | null;

  @ApiProperty({ enum: ['PENDING', 'PAID', 'OVERDUE'] })
  status!: string;
}

export class ListLoanApplicationsResponseDto {
  @ApiProperty({ type: [LoanApplicationResponseDto] })
  data!: LoanApplicationResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}

export class GetRepaymentScheduleResponseDto {
  @ApiProperty({ type: [LoanRepaymentScheduleItemDto] })
  data!: LoanRepaymentScheduleItemDto[];
}
