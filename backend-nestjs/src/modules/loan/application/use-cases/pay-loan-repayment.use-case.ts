import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LoanApplicationRepositoryPort, LoanRepaymentRepositoryPort } from '../../domain/repositories/loan.repository.port';
import { LOAN_APPLICATION_REPOSITORY_PORT, LOAN_REPAYMENT_REPOSITORY_PORT } from '../di-tokens';
import { LoanRepayment } from '../../domain/entities/loan-repayment.entity';
import { RepaymentStatus } from '../../domain/enums/repayment-status.enum';
import { AccountRepositoryPort } from '../../../account/domain/repositories/account.repository.port';
import { TransactionRepositoryPort } from '../../../account/domain/repositories/transaction.repository.port';
import { ACCOUNT_REPOSITORY_PORT, TRANSACTION_REPOSITORY_PORT } from '../../../account/application/di-tokens';
import { UNIT_OF_WORK_PORT } from '../../../../common/persistence/uow/di-tokens';
import { UnitOfWorkPort } from '../../../../common/persistence/uow/uow.port';
import { Transaction } from '../../../account/domain/entities/transaction.entity';
import { TransactionType } from '../../../account/domain/enums/transaction-type.enum';
import { AccountType } from '../../../account/domain/enums/account-type.enum';

function generateReferenceNumber(): string {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

@Injectable()
export class PayLoanRepaymentUseCase {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY_PORT)
    private readonly loanApplicationRepository: LoanApplicationRepositoryPort,
    @Inject(LOAN_REPAYMENT_REPOSITORY_PORT)
    private readonly loanRepaymentRepository: LoanRepaymentRepositoryPort,
    @Inject(ACCOUNT_REPOSITORY_PORT)
    private readonly accountRepository: AccountRepositoryPort,
    @Inject(TRANSACTION_REPOSITORY_PORT)
    private readonly transactionRepository: TransactionRepositoryPort,
    @Inject(UNIT_OF_WORK_PORT)
    private readonly uow: UnitOfWorkPort,
  ) {}

  async execute(repaymentId: number, fromAccountId: number, userId: number): Promise<LoanRepayment> {
    const repayment = await this.loanRepaymentRepository.findById(repaymentId);
    if (!repayment) {
      throw new NotFoundException('Repayment not found');
    }
    if (repayment.status === RepaymentStatus.PAID) {
      throw new BadRequestException('This installment is already paid');
    }

    const application = await this.loanApplicationRepository.findById(repayment.loanApplicationId);
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }
    if (application.userId !== userId) {
      throw new NotFoundException('Repayment not found');
    }
    if (!application.isApproved() || application.accountId == null) {
      throw new BadRequestException('Loan is not approved or has no linked account');
    }
    const loanAccountId = application.accountId;

    const fromAccount = await this.accountRepository.findById(fromAccountId);
    if (!fromAccount || fromAccount.isDeleted()) {
      throw new NotFoundException('Source account not found');
    }
    if (fromAccount.userId !== userId) {
      throw new NotFoundException('Source account not found');
    }
    if (fromAccount.type === AccountType.LOAN) {
      throw new BadRequestException('Cannot pay loan from a loan account. Use checking or savings.');
    }
    if (fromAccount.getAvailableBalance() < repayment.totalAmount) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${repayment.totalAmount}, available: ${fromAccount.getAvailableBalance()}`,
      );
    }

    return this.uow.withTransaction(async (tx) => {
      const accountRepo = this.accountRepository.withTx(tx);
      const txRepo = this.transactionRepository.withTx(tx);
      const repayRepo = this.loanRepaymentRepository.withTx(tx);

      try {
        fromAccount.withdraw(repayment.totalAmount);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Withdrawal failed';
        throw new BadRequestException(message);
      }

      await accountRepo.update(fromAccount);

      const ref = generateReferenceNumber();
      const refIn = `${ref}-IN`;
      const withdrawalTx = new Transaction(
        0,
        fromAccountId,
        TransactionType.WITHDRAWAL,
        repayment.totalAmount,
        fromAccount.getBalance(),
        `Loan repayment #${repayment.installmentNumber}`,
        ref,
        null,
        null,
        null,
        new Date(),
      );
      await txRepo.save(withdrawalTx);

      const now = new Date();
      const updatedRepayment = new LoanRepayment(
        repayment.id,
        repayment.loanApplicationId,
        repayment.installmentNumber,
        repayment.dueDate,
        repayment.principalAmount,
        repayment.interestAmount,
        repayment.penaltyAmount,
        repayment.totalAmount,
        now,
        RepaymentStatus.PAID,
        repayment.createdAt,
        now,
      );
      await repayRepo.update(updatedRepayment);

      const loanAccount = await accountRepo.findById(loanAccountId);
      if (loanAccount) {
        const loanRepayTx = new Transaction(
          0,
          loanAccountId,
          TransactionType.LOAN_REPAYMENT,
          repayment.totalAmount,
          loanAccount.getBalance(),
          `Repayment installment #${repayment.installmentNumber}`,
          refIn,
          null,
          null,
          null,
          new Date(),
        );
        await txRepo.save(loanRepayTx);
      }

      return updatedRepayment;
    });
  }
}
