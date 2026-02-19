import { Inject, Injectable } from '@nestjs/common';
import { AccountRepositoryPort } from '../../domain/repositories/account.repository.port';
import { AccountNumber } from '../../domain/value-objects/account-number.vo';
import { Account } from '../../domain/entities/account.entity';
import { AccountStatus } from '../../domain/enums/account-status.enum';
import { AccountType } from '../../domain/enums/account-type.enum';
import { CreateAccountCommand } from '../commands/create-account.command';
import { ACCOUNT_REPOSITORY_PORT } from '../di-tokens';
import { UNIT_OF_WORK_PORT } from '../../../../common/persistence/uow/di-tokens';
import { UnitOfWorkPort } from '../../../../common/persistence/uow/uow.port';

@Injectable()
export class CreateAccountUseCase {
  constructor(
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly uow: UnitOfWorkPort
  ) {}

  async execute(command: CreateAccountCommand): Promise<Account> {
    return this.uow.withTransaction(async (tx) => {
      const repo = this.accountRepository.withTx(tx);

      // Generate unique account number
      const accountNumber = await this.generateAccountNumber();

      // Calculate loan end date if it's a loan account
      let loanStartDate: Date | null = null;
      let loanEndDate: Date | null = null;
      let monthlyPayment: number | null = null;

      if (command.type === AccountType.LOAN && command.loanAmount && command.loanTermMonths) {
        loanStartDate = new Date();
        loanEndDate = new Date();
        loanEndDate.setMonth(loanEndDate.getMonth() + command.loanTermMonths);
        
        // Simple monthly payment calculation (principal only, interest would be added separately)
        monthlyPayment = command.loanAmount / command.loanTermMonths;
      }

      const account = new Account(
        0, // Will be set by database
        accountNumber,
        command.userId,
        command.type,
        command.currency,
        0, // Initial balance
        0, // Initial available balance
        AccountStatus.ACTIVE,
        command.interestRate ?? null,
        command.minimumBalance ?? null,
        command.loanAmount ?? null,
        command.loanTermMonths ?? null,
        loanStartDate,
        loanEndDate,
        monthlyPayment,
        null, // deletedAt
        new Date(),
        new Date()
      );

      return repo.save(account);
    });
  }

  private async generateAccountNumber(): Promise<AccountNumber> {
    // Generate account number: ACCT + timestamp + random 4 digits
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const accountNumberStr = `ACCT${timestamp}${random}`;
    
    // Check if it already exists (very unlikely but check anyway)
    const existing = await this.accountRepository.findByAccountNumberString(accountNumberStr);
    if (existing) {
      // Retry with new random number
      return this.generateAccountNumber();
    }
    
    return AccountNumber.create(accountNumberStr);
  }
}
