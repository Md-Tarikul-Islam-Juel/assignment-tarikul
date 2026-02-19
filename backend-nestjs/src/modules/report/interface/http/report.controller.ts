import { BadRequestException, Controller, Get, Query, Req, UseGuards, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccessTokenStrategy } from '../../../../common/auth/strategies/access-token.strategy';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { API_VERSIONS } from '../../../../common/http/version.constants';
import type { AuthenticatedRequest } from '../../../auth/application/types/auth.types';
import { AccountService } from '../../../account/application/services/account.service';
import { AccountMapper } from '../../../account/application/mappers/account.mapper';
import { UserService } from '../../../auth/application/services/user.service';
import { GetMonthlyStatementUseCase } from '../../application/use-cases/get-monthly-statement.use-case';
import { GetLoanBalancesReportUseCase } from '../../application/use-cases/get-loan-balances-report.use-case';
import {
  MonthlyStatementResponseDto,
  AccountSummaryReportResponseDto,
  AccountSummaryItemDto,
  LoanBalancesReportResponseDto,
  LoanBalanceItemDto,
  TransactionHistoryReportResponseDto
} from '../dto/report-response.dto';
import { TransactionDto } from '../../../account/interface/dto/account-response.dto';

@ApiTags('Reports & Statements')
@ApiBearerAuth()
@Controller({
  path: 'reports',
  version: [API_VERSIONS.V1],
})
@UseGuards(AccessTokenStrategy, RolesGuard)
export class ReportController {
  constructor(
    private readonly accountService: AccountService,
    private readonly userService: UserService,
    private readonly getMonthlyStatementUseCase: GetMonthlyStatementUseCase,
    private readonly getLoanBalancesReportUseCase: GetLoanBalancesReportUseCase
  ) {}

  @Get('statements/monthly')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Monthly account statement', description: 'Generate monthly statement with opening/closing balance and all transactions for the month.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Monthly statement' })
  async getMonthlyStatement(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('year', ParseIntPipe) year: number,
    @Query('month', ParseIntPipe) month: number,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean; data: MonthlyStatementResponseDto }> {
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;
    const account = await this.accountService.getAccount(accountId, userId);
    if (month < 1 || month > 12) {
      throw new BadRequestException('Month must be 1–12');
    }
    const result = await this.getMonthlyStatementUseCase.execute(
      accountId,
      year,
      month,
      account
    );
    return {
      success: true,
      data: {
        account: AccountMapper.toDto(result.account),
        period: result.period,
        openingBalance: result.openingBalance,
        transactions: result.transactions.map(AccountMapper.toTransactionDto),
        closingBalance: result.closingBalance
      }
    };
  }

  @Get('account-summary')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Account summary report', description: 'List all accounts with balances. Customers see own; staff can filter by userId.' })
  @ApiResponse({ status: HttpStatus.OK, type: AccountSummaryReportResponseDto })
  async getAccountSummary(
    @Query('userId') userIdQuery: string | undefined,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean; data: AccountSummaryItemDto[]; total: number }> {
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : (userIdQuery ? parseInt(userIdQuery, 10) : undefined);
    const result = await this.accountService.listAccounts({
      userId,
      limit: 500,
      offset: 0
    });
    const userIds = [...new Set(result.accounts.map((a) => a.userId))];
    const emailMap = await this.userService.getEmailsByIds(userIds);
    const data = result.accounts.map((acc) => {
      const dto = AccountMapper.toDto(acc);
      return {
        id: dto.id,
        accountNumber: dto.accountNumber,
        type: dto.type,
        currency: dto.currency,
        balance: dto.balance,
        availableBalance: dto.availableBalance,
        status: dto.status,
        ownerEmail: emailMap.get(acc.userId) ?? undefined
      };
    });
    return {
      success: true,
      data,
      total: result.total
    };
  }

  @Get('loan-balances')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Loan balances report', description: 'Approved loans with outstanding balance. Customers see own; staff can filter by userId.' })
  @ApiResponse({ status: HttpStatus.OK, type: LoanBalancesReportResponseDto })
  async getLoanBalances(
    @Query('userId') userIdQuery: string | undefined,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean; data: LoanBalanceItemDto[] }> {
    const user = req.user;
    const userIdParam = userIdQuery ? parseInt(userIdQuery, 10) : undefined;
    const items =
      user.role === 'CUSTOMER'
        ? await this.getLoanBalancesReportUseCase.executeForCustomer(user.id)
        : await this.getLoanBalancesReportUseCase.executeForStaff(userIdParam);
    const data = items.map((i) => ({
      loanApplicationId: i.loanApplicationId,
      userId: i.userId,
      loanType: i.loanType,
      currency: i.currency,
      totalAmount: i.totalAmount,
      paidPrincipal: i.paidPrincipal,
      outstandingBalance: i.outstandingBalance,
      status: i.status,
      accountId: i.accountId,
      appliedAt: i.appliedAt
    }));
    return { success: true, data };
  }

  @Get('transaction-history')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Transaction history report', description: 'Paginated transaction history for an account within a date range.' })
  @ApiResponse({ status: HttpStatus.OK, type: TransactionHistoryReportResponseDto })
  async getTransactionHistory(
    @Query('accountId', ParseIntPipe) accountId: number,
    @Query('startDate') startDateStr: string | undefined,
    @Query('endDate') endDateStr: string | undefined,
    @Query('limit') limitStr: string | undefined,
    @Query('offset') offsetStr: string | undefined,
    @Req() req: AuthenticatedRequest
  ): Promise<{ success: boolean; data: TransactionDto[]; total: number }> {
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;
    await this.accountService.getAccount(accountId, userId);
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;
    const limit = Math.min(Math.max(parseInt(limitStr ?? '50', 10) || 50, 1), 500);
    const offset = Math.max(parseInt(offsetStr ?? '0', 10) || 0, 0);
    const result = await this.accountService.getAccountHistory({
      accountId,
      startDate,
      endDate,
      limit,
      offset
    });
    return {
      success: true,
      data: result.transactions.map(AccountMapper.toTransactionDto),
      total: result.total
    };
  }
}
