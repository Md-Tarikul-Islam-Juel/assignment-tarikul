import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { LoanApplicationRepositoryPort } from '../../domain/repositories/loan.repository.port';
import { LOAN_APPLICATION_REPOSITORY_PORT } from '../di-tokens';
import { LoanApplication } from '../../domain/entities/loan-application.entity';
import { LoanType } from '../../domain/enums/loan-type.enum';
import { LoanApplicationStatus } from '../../domain/enums/loan-application-status.enum';
import { Currency } from '../../../account/domain/enums/currency.enum';

export interface ApplyLoanCommand {
  userId: number;
  loanType: LoanType;
  amount: number;
  termMonths: number;
  purpose?: string;
  currency?: Currency;
  penaltyRatePercentPerMonth?: number;
}

@Injectable()
export class ApplyLoanUseCase {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY_PORT)
    private readonly loanApplicationRepository: LoanApplicationRepositoryPort,
  ) {}

  async execute(command: ApplyLoanCommand): Promise<LoanApplication> {
    if (command.amount <= 0) {
      throw new BadRequestException('Loan amount must be positive');
    }
    if (command.termMonths < 1 || command.termMonths > 360) {
      throw new BadRequestException('Loan term must be between 1 and 360 months');
    }

    // Interest rate is set by admin/employee when approving, not by customer
    const application = new LoanApplication(
      0,
      command.userId,
      command.loanType,
      command.amount,
      command.termMonths,
      0,
      command.purpose?.trim() || null,
      command.currency ?? Currency.USD,
      LoanApplicationStatus.PENDING,
      new Date(),
      null,
      null,
      null,
      null,
      command.penaltyRatePercentPerMonth ?? 1,
      new Date(),
      new Date(),
    );

    return this.loanApplicationRepository.save(application);
  }
}
