import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LoanApplicationRepositoryPort, LoanRepaymentRepositoryPort } from '../../domain/repositories/loan.repository.port';
import { LOAN_APPLICATION_REPOSITORY_PORT, LOAN_REPAYMENT_REPOSITORY_PORT } from '../di-tokens';
import { LoanApplication } from '../../domain/entities/loan-application.entity';
import { LoanRepayment } from '../../domain/entities/loan-repayment.entity';
import { LoanApplicationStatus } from '../../domain/enums/loan-application-status.enum';
import { RepaymentStatus } from '../../domain/enums/repayment-status.enum';
import { AccountRepositoryPort } from '../../../account/domain/repositories/account.repository.port';
import { Account } from '../../../account/domain/entities/account.entity';
import { AccountNumber } from '../../../account/domain/value-objects/account-number.vo';
import { AccountStatus } from '../../../account/domain/enums/account-status.enum';
import { AccountType } from '../../../account/domain/enums/account-type.enum';
import { ACCOUNT_REPOSITORY_PORT } from '../../../account/application/di-tokens';
import { UNIT_OF_WORK_PORT } from '../../../../common/persistence/uow/di-tokens';
import { UnitOfWorkPort } from '../../../../common/persistence/uow/uow.port';
import { calculateAmortizationSchedule } from './amortization.helper';

@Injectable()
export class ApproveLoanUseCase {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY_PORT)
    private readonly loanApplicationRepository: LoanApplicationRepositoryPort,
    @Inject(LOAN_REPAYMENT_REPOSITORY_PORT)
    private readonly loanRepaymentRepository: LoanRepaymentRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly uow: UnitOfWorkPort,
  ) {}

  async execute(applicationId: number, decidedByUserId: number, interestRate: number): Promise<LoanApplication> {
    const application = await this.loanApplicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }
    if (!application.isPending()) {
      throw new BadRequestException('Only pending applications can be approved');
    }
    if (interestRate < 0 || interestRate > 100) {
      throw new BadRequestException('Interest rate must be between 0 and 100');
    }

    return this.uow.withTransaction(async (tx) => {
      const appRepo = this.loanApplicationRepository.withTx(tx);
      const repayRepo = this.loanRepaymentRepository.withTx(tx);
      const accountRepo = this.accountRepository.withTx(tx);

      const accountNumber = await this.generateAccountNumber(accountRepo);
      const loanStartDate = new Date();
      const loanEndDate = new Date();
      loanEndDate.setMonth(loanEndDate.getMonth() + application.termMonths);

      const firstDueDate = new Date();
      firstDueDate.setMonth(firstDueDate.getMonth() + 1);
      firstDueDate.setDate(1);
      const schedule = calculateAmortizationSchedule(
        application.amount,
        interestRate,
        application.termMonths,
        firstDueDate,
      );
      const monthlyPayment = schedule.length > 0 ? schedule[0].totalAmount : application.amount / application.termMonths;

      const account = new Account(
        0,
        accountNumber,
        application.userId,
        AccountType.LOAN,
        application.currency,
        0,
        0,
        AccountStatus.ACTIVE,
        interestRate,
        null,
        application.amount,
        application.termMonths,
        loanStartDate,
        loanEndDate,
        monthlyPayment,
        null,
        new Date(),
        new Date(),
        null,
        null,
        null,
      );
      const savedAccount = await accountRepo.save(account);

      const now = new Date();
      const repayments: LoanRepayment[] = schedule.map(
        (row) =>
          new LoanRepayment(
            0,
            application.id,
            row.installmentNumber,
            row.dueDate,
            row.principalAmount,
            row.interestAmount,
            0,
            row.totalAmount,
            null,
            RepaymentStatus.PENDING,
            now,
            now,
          ),
      );

      for (const r of repayments) {
        await repayRepo.save(r);
      }

      const updatedApp = new LoanApplication(
        application.id,
        application.userId,
        application.loanType,
        application.amount,
        application.termMonths,
        interestRate,
        application.purpose,
        application.currency,
        LoanApplicationStatus.APPROVED,
        application.appliedAt,
        new Date(),
        decidedByUserId,
        null,
        savedAccount.id,
        application.penaltyRatePercentPerMonth,
        application.createdAt,
        new Date(),
      );

      return appRepo.update(updatedApp);
    });
  }

  private async generateAccountNumber(accountRepo: AccountRepositoryPort): Promise<AccountNumber> {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const accountNumberStr = `ACCT${timestamp}${random}`;
    const existing = await accountRepo.findByAccountNumberString(accountNumberStr);
    if (existing) {
      return this.generateAccountNumber(accountRepo);
    }
    return AccountNumber.create(accountNumberStr);
  }
}
