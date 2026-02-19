import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenStrategy } from '../../../../common/auth/strategies/access-token.strategy';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { API_VERSIONS } from '../../../../common/http/version.constants';
import type { AuthenticatedRequest } from '../../../auth/application/types/auth.types';
import { CreateFixedDepositUseCase } from '../../application/use-cases/create-fixed-deposit.use-case';
import { CreateRecurringDepositUseCase } from '../../application/use-cases/create-recurring-deposit.use-case';
import { ListSavingsPlansUseCase } from '../../application/use-cases/list-savings-plans.use-case';
import { GetSavingsPlanUseCase } from '../../application/use-cases/get-savings-plan.use-case';
import { MonthlyInterestJobService } from '../../application/services/monthly-interest-job.service';
import { CreateFixedDepositDto, CreateRecurringDepositDto, ListSavingsPlansQueryDto } from '../dto/savings-plan-request.dto';
import { SavingsPlanResponseDto, ListSavingsPlansResponseDto } from '../dto/savings-plan-response.dto';
import { SavingsPlanStatus } from '../../domain/enums/plan-status.enum';
import { SavingsPlanType } from '../../domain/enums/plan-type.enum';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { HttpStatus } from '@nestjs/common';

@ApiTags('Savings Plans')
@ApiBearerAuth()
@Controller({
  path: 'savings-plans',
  version: [API_VERSIONS.V1],
})
@UseGuards(AccessTokenStrategy, RolesGuard)
export class SavingsPlanController {
  constructor(
    private readonly createFixedDepositUseCase: CreateFixedDepositUseCase,
    private readonly createRecurringDepositUseCase: CreateRecurringDepositUseCase,
    private readonly listPlansUseCase: ListSavingsPlansUseCase,
    private readonly getPlanUseCase: GetSavingsPlanUseCase,
    private readonly monthlyInterestJobService: MonthlyInterestJobService,
  ) {}

  @Post('fixed-deposit')
  @ApiOperation({ summary: 'Create fixed deposit', description: 'Debit principal from source account and open a fixed deposit plan.' })
  @ApiResponse({ status: HttpStatus.CREATED, type: SavingsPlanResponseDto })
  async createFixedDeposit(
    @Body() dto: CreateFixedDepositDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SavingsPlanResponseDto> {
    const plan = await this.createFixedDepositUseCase.execute(req.user.id, {
      sourceAccountId: dto.sourceAccountId,
      principal: dto.principal,
      termMonths: dto.termMonths,
      interestRate: dto.interestRate,
    });
    return SavingsPlanResponseDto.fromEntity(plan);
  }

  @Post('recurring-deposit')
  @ApiOperation({ summary: 'Create recurring deposit', description: 'Open a recurring deposit plan; first installment is not debited at creation.' })
  @ApiResponse({ status: HttpStatus.CREATED, type: SavingsPlanResponseDto })
  async createRecurringDeposit(
    @Body() dto: CreateRecurringDepositDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SavingsPlanResponseDto> {
    const plan = await this.createRecurringDepositUseCase.execute(req.user.id, {
      sourceAccountId: dto.sourceAccountId,
      monthlyAmount: dto.monthlyAmount,
      termMonths: dto.termMonths,
      interestRate: dto.interestRate,
    });
    return SavingsPlanResponseDto.fromEntity(plan);
  }

  @Get()
  @ApiOperation({ summary: 'List savings plans', description: 'List plans for the current user, optionally by status or plan type.' })
  @ApiResponse({ status: HttpStatus.OK, type: ListSavingsPlansResponseDto })
  async list(
    @Query() query: ListSavingsPlansQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ListSavingsPlansResponseDto> {
    const filters: { status?: SavingsPlanStatus; planType?: SavingsPlanType } = {};
    if (query.status && Object.values(SavingsPlanStatus).includes(query.status as SavingsPlanStatus)) {
      filters.status = query.status as SavingsPlanStatus;
    }
    if (query.planType && Object.values(SavingsPlanType).includes(query.planType as SavingsPlanType)) {
      filters.planType = query.planType as SavingsPlanType;
    }
    const plans = await this.listPlansUseCase.execute(req.user.id, Object.keys(filters).length ? filters : undefined);
    return {
      data: plans.map(SavingsPlanResponseDto.fromEntity),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get savings plan', description: 'Get plan by ID (must belong to current user).' })
  @ApiResponse({ status: HttpStatus.OK, type: SavingsPlanResponseDto })
  async get(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ): Promise<SavingsPlanResponseDto> {
    const plan = await this.getPlanUseCase.execute(id, req.user.id);
    return SavingsPlanResponseDto.fromEntity(plan);
  }

  @Post('run-monthly-interest')
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Run monthly interest job (dev/admin)', description: 'Manually trigger the monthly interest and maturity job.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Job completed' })
  async runMonthlyInterest(@Req() req: AuthenticatedRequest): Promise<{ message: string }> {
    return this.monthlyInterestJobService.runNow();
  }
}
