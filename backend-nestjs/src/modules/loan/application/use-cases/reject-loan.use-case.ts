import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LoanApplicationRepositoryPort } from '../../domain/repositories/loan.repository.port';
import { LOAN_APPLICATION_REPOSITORY_PORT } from '../di-tokens';
import { LoanApplication } from '../../domain/entities/loan-application.entity';
import { LoanApplicationStatus } from '../../domain/enums/loan-application-status.enum';

@Injectable()
export class RejectLoanUseCase {
  constructor(
    @Inject(LOAN_APPLICATION_REPOSITORY_PORT)
    private readonly loanApplicationRepository: LoanApplicationRepositoryPort,
  ) {}

  async execute(applicationId: number, decidedByUserId: number, rejectionReason?: string): Promise<LoanApplication> {
    const application = await this.loanApplicationRepository.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Loan application not found');
    }
    if (!application.isPending()) {
      throw new BadRequestException('Only pending applications can be rejected');
    }

    const updated = new LoanApplication(
      application.id,
      application.userId,
      application.loanType,
      application.amount,
      application.termMonths,
      application.interestRate,
      application.purpose,
      application.currency,
      LoanApplicationStatus.REJECTED,
      application.appliedAt,
      new Date(),
      decidedByUserId,
      rejectionReason?.trim() || null,
      null,
      application.penaltyRatePercentPerMonth,
      application.createdAt,
      new Date(),
    );

    return this.loanApplicationRepository.update(updated);
  }
}
