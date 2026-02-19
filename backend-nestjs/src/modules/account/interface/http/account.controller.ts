import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AccessTokenStrategy } from '../../../../common/auth/strategies/access-token.strategy';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { API_VERSIONS } from '../../../../common/http/version.constants';
import { AccountService } from '../../application/services/account.service';
import { CreateAccountDto, UpdateAccountDto, AccountQueryDto, AccountHistoryQueryDto, DepositDto, WithdrawDto, TransferDto } from '../dto/account-request.dto';
import {
  CreateAccountResponseDto,
  GetAccountResponseDto,
  ListAccountsResponseDto,
  AccountHistoryResponseDto
} from '../dto/account-response.dto';
import { AccountMapper } from '../../application/mappers/account.mapper';
import type { AuthenticatedRequest } from '../../../auth/application/types/auth.types';
import { CreateAccountCommand } from '../../application/commands/create-account.command';
import { UpdateAccountCommand } from '../../application/commands/update-account.command';
import { Currency } from '../../domain/enums/currency.enum';
import { UserService } from '../../../auth/application/services/user.service';

@ApiTags('Account Management')
@ApiBearerAuth()
@Controller({
  path: 'accounts',
  version: [API_VERSIONS.V1, API_VERSIONS.V2]
})
@UseGuards(AccessTokenStrategy, RolesGuard)
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly userService: UserService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Create a new account', description: 'Creates an account for a customer. Admin/Employee only. Provide customer email or userId to identify the customer.' })
  @ApiResponse({ status: HttpStatus.CREATED, type: CreateAccountResponseDto })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Insufficient permissions - only Admin and Employee can create accounts' })
  async createAccount(
    @Body() dto: CreateAccountDto,
    @Req() req: AuthenticatedRequest
  ): Promise<CreateAccountResponseDto> {
    let userId: number | undefined = dto.userId;

    if (dto.customerEmail) {
      const email = dto.customerEmail.trim().toLowerCase();
      const user = await this.userService.findUserByEmail(email);
      if (!user) {
        throw new BadRequestException(`No customer found with email: ${email}`);
      }
      if (user.role !== 'CUSTOMER') {
        throw new BadRequestException(`Account can only be created for a customer. User ${email} has role: ${user.role}`);
      }
      userId = user.id;
    }

    if (userId == null) {
      throw new BadRequestException('Provide either customer email or customer user ID.');
    }

    const command = CreateAccountCommand.fromDto({
      userId,
      type: dto.type,
      currency: dto.currency ?? Currency.USD,
      interestRate: dto.interestRate,
      minimumBalance: dto.minimumBalance,
      loanAmount: dto.loanAmount,
      loanTermMonths: dto.loanTermMonths
    });

    const account = await this.accountService.createAccount(command);

    return {
      success: true,
      data: AccountMapper.toDto(account),
      message: 'Account created successfully'
    };
  }

  @Get()
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'List accounts', description: 'List accounts. Customers see only their accounts, employees/admins see all.' })
  @ApiResponse({ status: HttpStatus.OK, type: ListAccountsResponseDto })
  async listAccounts(
    @Query() query: AccountQueryDto,
    @Req() req: AuthenticatedRequest
  ): Promise<ListAccountsResponseDto> {
    // Customers can only see their own accounts
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : query.userId;

    const limit = Math.min(Math.max(query.limit ?? 10, 1), 100);
    const offset = Math.max(query.offset ?? 0, 0);

    const result = await this.accountService.listAccounts({
      userId,
      type: query.type,
      status: query.status,
      limit,
      offset
    });

    const userIds = [...new Set(result.accounts.map((a) => a.userId))];
    const emailMap = await this.userService.getEmailsByIds(userIds);

    const data = result.accounts.map((acc) => {
      const dto = AccountMapper.toDto(acc);
      return { ...dto, ownerEmail: emailMap.get(acc.userId) ?? '' };
    });

    return {
      success: true,
      data,
      total: result.total,
      limit,
      offset
    };
  }

  @Get(':id')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get account by ID', description: 'Get account details by ID. Customers can only access their own accounts.' })
  @ApiResponse({ status: HttpStatus.OK, type: GetAccountResponseDto })
  async getAccount(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ): Promise<GetAccountResponseDto> {
    const accountId = parseInt(id, 10);
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;

    const account = await this.accountService.getAccount(accountId, userId);

    return {
      success: true,
      data: AccountMapper.toDto(account)
    };
  }

  @Get('number/:accountNumber')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get account by account number', description: 'Get account details by account number.' })
  @ApiResponse({ status: HttpStatus.OK, type: GetAccountResponseDto })
  async getAccountByNumber(
    @Param('accountNumber') accountNumber: string,
    @Req() req: AuthenticatedRequest
  ): Promise<GetAccountResponseDto> {
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;

    const account = await this.accountService.getAccountByAccountNumber(accountNumber, userId);

    return {
      success: true,
      data: AccountMapper.toDto(account)
    };
  }

  @Post(':id/deposit')
  @Roles('ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deposit', description: 'Deposit funds into an account. Admin and Employee only; customers cannot deposit.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Deposit successful' })
  async deposit(
    @Param('id') id: string,
    @Body() dto: DepositDto,
    @Req() req: AuthenticatedRequest
  ) {
    const accountId = parseInt(id, 10);
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;
    await this.accountService.getAccount(accountId, userId);
    return this.accountService.deposit(accountId, dto.amount, dto.description);
  }

  @Post(':id/withdraw')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Withdraw', description: 'Withdraw funds from an account. Subject to daily limits. Customers can only withdraw from their own accounts. Admin and Employee can withdraw from any account.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Withdrawal successful' })
  async withdraw(
    @Param('id') id: string,
    @Body() dto: WithdrawDto,
    @Req() req: AuthenticatedRequest
  ) {
    const accountId = parseInt(id, 10);
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;
    await this.accountService.getAccount(accountId, userId);
    return this.accountService.withdraw(accountId, dto.amount, dto.description);
  }

  @Post(':id/transfer')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer', description: 'Transfer funds to another account (by account number). Fees may apply. Customers can only transfer from their own accounts. Admin and Employee can transfer from any account.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transfer successful' })
  async transfer(
    @Param('id') id: string,
    @Body() dto: TransferDto,
    @Req() req: AuthenticatedRequest
  ) {
    const fromAccountId = parseInt(id, 10);
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;
    await this.accountService.getAccount(fromAccountId, userId);
    return this.accountService.transfer(fromAccountId, dto.toAccountNumber, dto.amount, dto.description);
  }

  @Put(':id')
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Update account', description: 'Update account details. Only employees and admins can update accounts.' })
  @ApiResponse({ status: HttpStatus.OK, type: GetAccountResponseDto })
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto
  ): Promise<GetAccountResponseDto> {
    const accountId = parseInt(id, 10);

    const command = UpdateAccountCommand.fromDto({
      accountId,
      status: dto.status,
      interestRate: dto.interestRate,
      minimumBalance: dto.minimumBalance,
      dailyWithdrawalLimit: dto.dailyWithdrawalLimit,
      transferFeePercent: dto.transferFeePercent,
      transferFeeFixed: dto.transferFeeFixed
    });

    const account = await this.accountService.updateAccount(command);

    return {
      success: true,
      data: AccountMapper.toDto(account)
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles('ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Delete account', description: 'Delete an account. Admin and Employee can delete accounts.' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async deleteAccount(@Param('id') id: string): Promise<void> {
    const accountId = parseInt(id, 10);
    await this.accountService.deleteAccount(accountId, false);
  }

  @Get(':id/history')
  @Roles('CUSTOMER', 'ADMIN', 'EMPLOYEE')
  @ApiOperation({ summary: 'Get account transaction history', description: 'Get transaction history for an account.' })
  @ApiResponse({ status: HttpStatus.OK, type: AccountHistoryResponseDto })
  async getAccountHistory(
    @Param('id') id: string,
    @Query() query: AccountHistoryQueryDto,
    @Req() req: AuthenticatedRequest
  ): Promise<AccountHistoryResponseDto> {
    const accountId = parseInt(id, 10);
    
    // Verify account exists and user has access
    const userId = req.user.role === 'CUSTOMER' ? req.user.id : undefined;
    await this.accountService.getAccount(accountId, userId);

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    const result = await this.accountService.getAccountHistory({
      accountId,
      type: query.type,
      limit: query.limit || 10,
      offset: query.offset || 0,
      startDate,
      endDate
    });

    return {
      success: true,
      data: result.transactions.map(AccountMapper.toTransactionDto),
      total: result.total
    };
  }
}
