import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenStrategy } from '../../../../common/auth/strategies/access-token.strategy';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { API_VERSIONS } from '../../../../common/http/version.constants';
import { LoanService } from '../../application/services/loan.service';
import { LoanMapper } from '../../application/mappers/loan.mapper';
import { ApplyLoanDto, ApproveLoanDto, RejectLoanDto, PayLoanRepaymentDto } from '../dto/loan-request.dto';
import {
  LoanApplicationResponseDto,
  ListLoanApplicationsResponseDto,
  GetRepaymentScheduleResponseDto,
} from '../dto/loan-response.dto';
import type { AuthenticatedRequest } from '../../../auth/application/types/auth.types';
import { LoanApplicationStatus } from '../../domain/enums/loan-application-status.enum';

@ApiTags('Loan Management')
@ApiBearerAuth()
@Controller({
  path: 'loans',
  version: [API_VERSIONS.V1, API_VERSIONS.V2],
})
@UseGuards(AccessTokenStrategy, RolesGuard)
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post('applications')
  @HttpCode(HttpStatus.CREATED)
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Apply for a loan', description: 'Customer submits a loan application.' })
  @ApiResponse({ status: HttpStatus.CREATED, type: LoanApplicationResponseDto })
  async apply(@Body() dto: ApplyLoanDto, @Req() req: AuthenticatedRequest) {
    const app = await this.loanService.applyLoan({
      userId: req.user.id,
      loanType: dto.loanType,
      amount: dto.amount,
      termMonths: dto.termMonths,
      purpose: dto.purpose,
      currency: dto.currency,
      penaltyRatePercentPerMonth: dto.penaltyRatePercentPerMonth,
    });
    return {
      success: true,
      data: LoanMapper.toApplicationDto(app),
      message: 'Loan application submitted successfully',
    };
  }

  @Get('applications')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'List loan applications', description: 'Customers see their own; Admin/Employee see all with optional filters.' })
  @ApiResponse({ status: HttpStatus.OK, type: ListLoanApplicationsResponseDto })
  async list(
    @Query('status') status?: LoanApplicationStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('userId') userId?: number,
    @Req() req?: AuthenticatedRequest,
  ) {
    const user = req!.user;
    const limitNum = Math.min(Math.max(limit ?? 20, 1), 100);
    const offsetNum = Math.max(offset ?? 0, 0);

    if (user.role === 'CUSTOMER') {
      const result = await this.loanService.listForCustomer(user.id, { status, limit: limitNum, offset: offsetNum });
      return {
        success: true,
        data: result.applications.map(LoanMapper.toApplicationDto),
        total: result.total,
        limit: limitNum,
        offset: offsetNum,
      };
    }

    const result = await this.loanService.listForStaff({ userId, status, limit: limitNum, offset: offsetNum });
    return {
      success: true,
      data: result.applications.map(LoanMapper.toApplicationDto),
      total: result.total,
      limit: limitNum,
      offset: offsetNum,
    };
  }

  @Get('applications/:id')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get loan application by ID' })
  @ApiResponse({ status: HttpStatus.OK, type: LoanApplicationResponseDto })
  async getOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const applicationId = parseInt(id, 10);
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;
    const app = await this.loanService.getApplication(applicationId, userId);
    return {
      success: true,
      data: LoanMapper.toApplicationDto(app),
    };
  }

  @Post('applications/:id/approve')
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Approve loan application', description: 'Admin/Employee sets interest rate and creates LOAN account and repayment schedule.' })
  @ApiResponse({ status: HttpStatus.OK, type: LoanApplicationResponseDto })
  async approve(@Param('id') id: string, @Body() dto: ApproveLoanDto, @Req() req: AuthenticatedRequest) {
    const applicationId = parseInt(id, 10);
    const app = await this.loanService.approve(applicationId, req.user.id, dto.interestRate);
    return {
      success: true,
      data: LoanMapper.toApplicationDto(app),
      message: 'Loan approved. Account and repayment schedule created.',
    };
  }

  @Post('applications/:id/reject')
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Reject loan application' })
  @ApiResponse({ status: HttpStatus.OK, type: LoanApplicationResponseDto })
  async reject(@Param('id') id: string, @Body() dto: RejectLoanDto, @Req() req: AuthenticatedRequest) {
    const applicationId = parseInt(id, 10);
    const app = await this.loanService.reject(applicationId, req.user.id, dto.rejectionReason);
    return {
      success: true,
      data: LoanMapper.toApplicationDto(app),
      message: 'Loan application rejected',
    };
  }

  @Get('applications/:id/schedule')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get repayment schedule', description: 'Includes penalty calculation for overdue installments.' })
  @ApiResponse({ status: HttpStatus.OK, type: GetRepaymentScheduleResponseDto })
  async getSchedule(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const applicationId = parseInt(id, 10);
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;
    const schedule = await this.loanService.getRepaymentSchedule(applicationId, userId);
    return {
      success: true,
      data: schedule.map(LoanMapper.toRepaymentScheduleItemDto),
    };
  }

  @Post('repayments/:id/pay')
  @Roles('CUSTOMER')
  @ApiOperation({ summary: 'Pay loan installment', description: 'Customer pays a due installment from one of their accounts (by repayment id).' })
  @ApiResponse({ status: HttpStatus.OK })
  async payRepayment(@Param('id') id: string, @Body() dto: PayLoanRepaymentDto, @Req() req: AuthenticatedRequest) {
    const repaymentId = parseInt(id, 10);
    const repayment = await this.loanService.payRepayment(repaymentId, dto.fromAccountId, req.user.id);
    return {
      success: true,
      data: LoanMapper.toRepaymentScheduleItemDto({
        id: repayment.id,
        loanApplicationId: repayment.loanApplicationId,
        installmentNumber: repayment.installmentNumber,
        dueDate: repayment.dueDate,
        principalAmount: repayment.principalAmount,
        interestAmount: repayment.interestAmount,
        penaltyAmount: repayment.penaltyAmount,
        totalAmount: repayment.totalAmount,
        paidAt: repayment.paidAt,
        status: repayment.status,
      }),
      message: 'Payment successful',
    };
  }
}
