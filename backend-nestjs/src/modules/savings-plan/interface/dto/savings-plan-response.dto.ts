import { ApiProperty } from '@nestjs/swagger';
import { SavingsPlanType } from '../../domain/enums/plan-type.enum';
import { SavingsPlanStatus } from '../../domain/enums/plan-status.enum';
import { SavingsPlan } from '../../domain/entities/savings-plan.entity';

export class SavingsPlanResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  userId!: number;

  @ApiProperty()
  sourceAccountId!: number;

  @ApiProperty({ enum: SavingsPlanType })
  planType!: SavingsPlanType;

  @ApiProperty()
  currency!: string;

  @ApiProperty({ nullable: true })
  principal!: number | null;

  @ApiProperty({ nullable: true })
  monthlyAmount!: number | null;

  @ApiProperty()
  interestRate!: number;

  @ApiProperty()
  termMonths!: number;

  @ApiProperty()
  startDate!: Date;

  @ApiProperty()
  endDate!: Date;

  @ApiProperty({ enum: SavingsPlanStatus })
  status!: SavingsPlanStatus;

  @ApiProperty()
  interestCreditedTotal!: number;

  @ApiProperty({ nullable: true })
  lastInterestCreditedAt!: Date | null;

  @ApiProperty()
  totalDeposited!: number;

  @ApiProperty({ nullable: true })
  nextDueDate!: Date | null;

  @ApiProperty()
  currentValue!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(plan: SavingsPlan): SavingsPlanResponseDto {
    const dto = new SavingsPlanResponseDto();
    dto.id = plan.id;
    dto.userId = plan.userId;
    dto.sourceAccountId = plan.sourceAccountId;
    dto.planType = plan.planType;
    dto.currency = plan.currency;
    dto.principal = plan.principal;
    dto.monthlyAmount = plan.monthlyAmount;
    dto.interestRate = plan.interestRate;
    dto.termMonths = plan.termMonths;
    dto.startDate = plan.startDate;
    dto.endDate = plan.endDate;
    dto.status = plan.status;
    dto.interestCreditedTotal = plan.interestCreditedTotal;
    dto.lastInterestCreditedAt = plan.lastInterestCreditedAt;
    dto.totalDeposited = plan.totalDeposited;
    dto.nextDueDate = plan.nextDueDate;
    dto.currentValue = plan.getCurrentValue();
    dto.createdAt = plan.createdAt;
    dto.updatedAt = plan.updatedAt;
    return dto;
  }
}

export class ListSavingsPlansResponseDto {
  @ApiProperty({ type: [SavingsPlanResponseDto] })
  data!: SavingsPlanResponseDto[];
}
